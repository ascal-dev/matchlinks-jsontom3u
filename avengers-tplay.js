const axios = require('axios');

const cheerio = require('cheerio');

const fs = require('fs');

const https = require('https');

const http = require('http');



// ============================================

// ADVANCED CONFIGURATION

// ============================================



const CONFIG = {

  CONCURRENCY: 15,           // Parallel requests (increased from sequential)

  TIMEOUT: 8000,             // ms

  RETRY_ATTEMPTS: 2,         // Retry failed requests

  BATCH_SIZE: 50,            // Process results in batches

  CACHE_MANIFEST: true,      // Cache decoded scripts

  CHUNK_SIZE: 100            // Write results in chunks for memory efficiency

};



// ============================================

// OPTIMIZED HTTP AGENT (Connection Pooling)

// ============================================



const httpAgent = new http.Agent({ 

  keepAlive: true, 

  maxSockets: CONFIG.CONCURRENCY + 5,

  maxFreeSockets: 10,

  timeout: CONFIG.TIMEOUT

});



const httpsAgent = new https.Agent({ 

  keepAlive: true, 

  maxSockets: CONFIG.CONCURRENCY + 5,

  maxFreeSockets: 10,

  timeout: CONFIG.TIMEOUT

});



const axiosInstance = axios.create({

  httpAgent,

  httpsAgent,

  timeout: CONFIG.TIMEOUT

});



// ============================================

// CACHING & MEMOIZATION

// ============================================



const scriptCache = new Map();

const manifestCache = new Map();



// IDs

const IDs = [

  {

    "channel_id": "15",

    "Channel_name": "Set Hd",

    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-43-j5fca4k0-v3/imageContent-43-j5fca4k0-m4.png",

    "Language": "Hindi"

  },

  {

    "channel_id": "36",

    "Channel_name": "News Nation",

    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-114-j5fl632o-v1/imageContent-114-j5fl632o-m1.png",

    "Language": "Hindi"

  }

]

// ============================================

// OPTIMIZED BASE CONVERSION (Lookup Table)

// ============================================



const CHAR_MAP = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";



function baseConvert(str, fromBase, toBase) {

  const from = CHAR_MAP.slice(0, fromBase);

  

  let num = 0;

  for (let i = str.length - 1, pow = 1; i >= 0; i--, pow *= fromBase) {

    const idx = from.indexOf(str[i]);

    if (idx !== -1) num += idx * pow;

  }



  if (num === 0) return "0";

  

  const to = CHAR_MAP.slice(0, toBase);

  let out = "";

  while (num > 0) {

    out = to[num % toBase] + out;

    num = Math.floor(num / toBase);

  }

  

  return out;

}



// ============================================

// OPTIMIZED PACKED SCRIPT DECODER

// ============================================



const PACKED_REGEX = /eval\(function\(h,u,n,t,e,r\)\{[\s\S]*?\}\("([^"]+)",(\d+),"([^"]+)",(\d+),(\d+),(\d+)\)\)/;



function decodePackedScript(packed) {

  if (CONFIG.CACHE_MANIFEST && scriptCache.has(packed)) {

    return scriptCache.get(packed);

  }



  const match = packed.match(PACKED_REGEX);

  if (!match) return null;



  const [, h, u, n, t, e] = match;

  let result = "";

  let i = 0;



  const eInt = parseInt(e);

  const tInt = parseInt(t);

  const nLen = n.length;



  while (i < h.length) {

    let s = "";

    const delimiter = n[eInt];



    while (h[i] !== delimiter) {

      s += h[i];

      i++;

    }

    i++;



    for (let j = 0; j < nLen; j++) {

      s = s.replaceAll(n[j], String(j));

    }



    const charCode = parseInt(baseConvert(s, eInt, 10), 10) - tInt;

    if (charCode >= 0) {

      result += String.fromCharCode(charCode);

    }

  }



  try {

    result = decodeURIComponent(escape(result));

  } catch (e) {

    // Fallback to raw result

  }



  if (CONFIG.CACHE_MANIFEST) {

    scriptCache.set(packed, result);

  }



  return result;

}



// ============================================

// OPTIMIZED REGEX EXTRACTION (Pre-compiled)

// ============================================



const EXTRACT_PATTERNS = {

  manifest: /manifest\s*=\s*['"]([^'"]+)['"]/,

  cookie: /cookie\s*=\s*['"]([^'"]+)['"]/,

  hdneaCookie: /hdneaCookie\s*=\s*['"]([^'"]+)['"]/,

  keyid: /keyid\s*=\s*['"]([^'"]+)['"]/,

  key: /key\s*=\s*['"]([^'"]+)['"]/,

  extraHeaders: /extraHeaders\s*=\s*['"]([^'"]+)['"]/

};



function extractVariable(source, varName) {

  const pattern = EXTRACT_PATTERNS[varName];

  if (!pattern) return '';

  const match = source.match(pattern);

  return match ? match[1] : '';

}







// ============================================

// RETRY LOGIC

// ============================================



async function fetchWithRetry(url, attempt = 1) {

  try {

    return await axiosInstance.get(url, {

      headers: {

        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

      }

    });

  } catch (error) {

    if (attempt < CONFIG.RETRY_ATTEMPTS && error.code !== 'ENOTFOUND') {

      await new Promise(r => setTimeout(r, 300 * attempt));

      return fetchWithRetry(url, attempt + 1);

    }

    throw error;

  }

}



// ============================================

// CORE SCRAPING FUNCTION

// ============================================



async function scrapeId(idObj) {

  const url = `https://avengers-web.hakunamata.workers.dev/?id=${idObj.channel_id}`;



  try {

    const response = await fetchWithRetry(url);

    const $ = cheerio.load(response.data);



    const logo = $('.player-bottom-meta img.meta-logo').attr('src') || idObj.Channel_logo;



    let decodedScript = '';

    const scripts = $('script');

    

    for (let i = 0; i < scripts.length; i++) {

      const scriptContent = $(scripts[i]).html();

      if (scriptContent && scriptContent.includes('eval(function(h,u,n,t,e,r)')) {

        decodedScript = decodePackedScript(scriptContent);

        if (decodedScript) break;

      }

    }



    if (!decodedScript) {

      return { 

        ...idObj, 

        Channel_logo: logo, 

        status: 'failed_to_decode' 

      };

    }



    return {

      ...idObj,

      Channel_logo: logo,

      manifest: extractVariable(decodedScript, 'manifest'),

      cookie: extractVariable(decodedScript, 'cookie'),

      hdneaCookie: extractVariable(decodedScript, 'hdneaCookie'),

      keyid: extractVariable(decodedScript, 'keyid'),

      key: extractVariable(decodedScript, 'key'),

      extraHeaders: extractVariable(decodedScript, 'extraHeaders'),

      status: 'success'

    };



  } catch (error) {

    return { ...idObj, status: 'error', error: error.message };

  }

}



// ============================================

// CONCURRENT BATCH PROCESSING

// ============================================



async function processBatch(ids, progressCallback) {

  const promises = ids.map(idObj => scrapeId(idObj));

  const results = [];



  for (let i = 0; i < promises.length; i += CONFIG.BATCH_SIZE) {

    const batch = promises.slice(i, i + CONFIG.BATCH_SIZE);

    const batchResults = await Promise.all(batch);

    results.push(...batchResults);

    

    if (progressCallback) {

      progressCallback(results.length, ids.length);

    }

  }



  return results;

}



// ============================================

// MAIN EXECUTION

// ============================================



async function main() {

  const startTime = Date.now();

  const results = [];

  const writeStream = fs.createWriteStream('avengers-tplay.json');



  console.log(`📊 Starting extraction with ${CONFIG.CONCURRENCY} concurrent connections...`);

  console.log(`⚙️  Configuration: Retries=${CONFIG.RETRY_ATTEMPTS}, Cache=${CONFIG.CACHE_MANIFEST}`);

  console.log(`📡 Processing ${IDs.length} IDs...\n`);



  // Split into concurrent batches

  const chunks = [];

  for (let i = 0; i < IDs.length; i += CONFIG.CONCURRENCY) {

    chunks.push(IDs.slice(i, i + CONFIG.CONCURRENCY));

  }



  writeStream.write('[\n');

  let isFirst = true;



  for (const chunk of chunks) {

    const batchResults = await Promise.all(chunk.map(idObj => scrapeId(idObj)));



    for (const result of batchResults) {

      if (!isFirst) writeStream.write(',\n');

      const formatted = JSON.stringify(result, null, 2).split('\n').map((line, idx) => idx === 0 ? '  ' + line : '  ' + line).join('\n');

      writeStream.write(formatted);

      isFirst = false;

      results.push(result);

    }



    const progress = results.length;

    const percentage = ((progress / IDs.length) * 100).toFixed(1);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    const estimated = (elapsed / progress * IDs.length).toFixed(1);

    

    process.stdout.write(`\r✅ ${progress}/${IDs.length} (${percentage}%) - ${elapsed}s / ~${estimated}s`);

  }



  writeStream.write('\n]');

  writeStream.end();



  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);



  await new Promise((resolve, reject) => {

    writeStream.on('finish', resolve);

    writeStream.on('error', reject);

  });



  console.log(`\n\n🎉 Complete in ${totalTime}s`);

  console.log(`📁 Saved to avengers-tplay.json`);

  

  const stats = {

    total: results.length,

    success: results.filter(r => r.status === 'success').length,

    errors: results.filter(r => r.status === 'error').length,

    failed_decode: results.filter(r => r.status === 'failed_to_decode').length,

    time_seconds: totalTime,

    avg_per_id: (totalTime / results.length).toFixed(3)

  };



  console.log('\n📈 Statistics:');

  console.log(JSON.stringify(stats, null, 2));

}



main().catch(console.error);
