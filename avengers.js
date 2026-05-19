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
const IDs = ["3544","3543","3542","3389","3440","587","3027","3053","3343","3288","3287","3201","3282","626","3492","3336","3358","3338","3541","1699","3497","3029","3467","2754","1246","3417","3345","3360","3320","3393","441","3529","1906","951","3289","1428","3346","3483","3534","3395","3065","1562","3112","1972","3329","3478","231","3504","858","3285","3180","3359","3394","182","3323","3324","3090","3179","2019","2027","1725","3290","3459","504","1251","3438","3321","612","3327","652","1553","1403","3396","3259","3352","732","3524","3392","3518","177","1454","2005","3481","3469","3304","440","872","2327","3075","672","3322","235","3253","3533","3505","1186","3074","3409","3317","3535","183","1613","3328","3286","1295","3107","1590","3202","3540","3325","3357","3443","3401","960","2184","202","3255","2959","908","1209","1977","3277","3028","1274","1974","3463","1885","3405","252","1670","291","248","3115","3098","3181","1411","985","1698","539","1985","3050","1532","1354","1759","2014","1408","2022","605","540","792","2253","899","959","633","3526","2021","190","875","1119","764","527","512","725","1296","955","616","3225","889","1747","1733","3125","618","3532","493","1394","3274","3294","1137","2862","279","143","3220","3486","442","474","3127","1114","3176","1612","2423","3070","659","3041","1154","1697","747","808","1110","1084","3140","656","1665","1143","785","1175","2772","596","3266","3402","683","1773","718","1370","910","1252","651","1632","3085","3174","3460","413","728","144","3184","3024","936","3063","748","2002","1907","2031","815","3016","461","1635","857","1083","1432","1429","1261","3500","1278","598","898","1212","719","667","3368","1179","557","429","631","1369","2437","1772","1471","972","3006","599","2077","412","3124","1551","742","185","876","1224","529","611","1082","919","3136","554","885","563","2225","699","1089","965","765","1537","3436","3369","989","503","690","3310","572","3313","1563","592","3498","575","3260","1078","3234","1964","1329","638","1388","1250","3088","3060","670","2008","1326","1091","1417","891","901","980","1871","595","1118","406","519","1955","1223","1159","828","3361","1891","2325","1373","790","892","3083","383","401","664","1555","3069","203","3281","2034","636","477","501","1368","950","1634","3197","1452","934","1116","1795","1790","3100","2782","3123","1956","3462","3186","3058","1189","2352","706","3118","1650","2078","2424","3373","1735","1761","1793","801","545","783","2779","164","1210","1856","1086","695","1706","684","937","3191","665","775","415","3163","691","3121","3269","2079","735","250","734","778","3382","3484","1293","597","693","3365","196","1406","3278","1401","3418","193","2228","3399","2916","1516","2766","408","555","1560","1092","2753","1260","3122","528","1561","3485","2742","3162","3137","212","3178","3011","714","1362","630","3444","1112","755","3026","3295","580","484","3187","982","522","918","3430","2784","2229","741","445","3005","842","3144","1728","1651","2771","3519","2773","3096","3385","939","400","2353","3086","1427","687","992","720","2254","1359","1071","2082","821","1193","846","1106","3537","1113","464","3141","496","1798","3314","3049","1521","2938","1477","623","1087","1859","4007","774","609","916","1093","1447","3235","1136","617","2045","830","987","1405","3025","769","1356","2780","929","653","1564","362","3204","648","3099","2354","762","996","2224","2743","459","789","1172","571","3167","368","2759","2778","696","3043","3273","1287","3461","417","3239","492","779","3095","502","613","289","837","520","3379","1746","1120","3380","2852","606","404","499","3354","2932","826","971","3132","1108","1817","727","1077","697","1644","583","3189","756","489","1192","3219","824","3166","3117","666","767","3128","1433","3108","1130","1286","689","258","2936","3374","2783","1191","180","1594","3299","716","1325","895","3291","647","1158","1138","770","1895","603","1315","3143","810","1450","1324","1254","677","3431","3064","933","927","3283","2007","2004","788","1426","786","2255","255","2934","3084","1453","658","1900","757","1614","3530","983","3126","1804","3130","3493","486","1780","3276","2832","1754","1190","591","317","3188","814","999","1549","1598","3192","702","3244","1126","838","1226","1140","511","1123","1171","698","3240","2957","904","473","517","516","3236","1374","1328","896","2003","931","782","2063","1984","678","1263","1667","494","990","1070","723","487","259","184","300322","1669","994","1127","784","3371","1691","2933","232","1743","1291","466","2028","1121","3175","3490","1961","882","894","773","498","1187","2252","3164","988","1959","513","1695","465","3451","1538","3381","2917","3004","619","2774","482","1542","3008","961","1332","856","1396","915","998","1142","627","796","1954","565","3113","1115","407","3279","3458","682","1657","3152","1360","370","1705","1633","956","1531","704","1273","3104","471","2827","1529","443","560","807","844","2851","707","3427","1975","614","2435","886","1855","1337","472","1371","993","3022","1358","708","3171","336","776","1153","2914","1104","518","685","3464","1117","523","1414","2956","3370","3154","673","162","194348","3131","3111","787","1230","538","1451","2935","2187","1131","743","3031","3023","1853","530","1518","3261","703","2326","1146","153","3292","903","620","843","3145","3139","3502","675","1673","877","167","1294","2767","1256","3185","970","561","710","3508","953","1868","2323","661","457","2777","533","668","3265","726","1886","1692","1655","2081","3453","3019","712","1967","733","880","541","1662","946","151","1124","1264","781","490","3039","1543","997","1925","977","3538","809","1898","803","3434","3471","3203","2752","921","3119","654","2258","2947","3237","420","1404","1457","1528","777","3120","3397","686","879","1125","1375","607","1139","1957","531","569","204","3059","3232","1647","1163","794","2020","1085","414","3110","402","3218","3014","3333","1122","1481","601","991","1335","3142","3190","3221","907","3007","525","981","460","2017","1351","2918","1834","3103","715","3170","772","851","3105","3168","1255","3213","709","491","515","3214","2765","963","722","1618","3135","3470","1672","655","3045","558","2775","3129","3038","3503","1958","975","1998","642","958","1515","3267","768","2768","1694","625","694","3280","639","1973","1088","3017","760","2834","1111","1763","744","3330","3134","1389","2064","3372","2751","146","154","1141","1322","637","780","1338","924","713","288","671","3172","897","1741","634","419","1799","1850","662","602","3334","411","578","3230","1858","403","514","646","900","883","2946","3068","676","155","1170","3133","3087","3146","1745","1999","1407","2351","495","536","2854","3384","3155","1392","737","2835","593","3243","1593","175","3153","1075","3383","2230","906","2954","594","559","740","488","409","643","1751","3138","624","1666","3367","3076","635","510","650","1069","2770","1757","944","2948","615","3042","1847","871","3231","1607","2764","570","1736","2322","1854","1132","1145","1545","418","2945","3097","1897","835","1319","866","2853","585","984","544","791","3258","3398","1185","632","608","986","957","3018","2937","804","855","1896","705","751","850","1109","3048","1094","692","1643","641","1129","731","1641","1257","2433","724","3216","1550","1568","3284","2761","3378","831","1205","628","1797","2434","729","995","3177","3242","173","923","1410","566","1227","2436","3066","717","816","739","3268","3051","3312","410","524","1458","1232","483","165","1363","1090","832","829","3227","2176","405","156","2188","1174","1431","1605","1391","1965","657","2958","3332","2750"];

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
  manifest: /manifest\s*=\s*['"`]([^'"`]+)['"`]/,
  cookie: /cookie\s*=\s*['"`]([^'"`]+)['"`]/,
  keyid: /keyid\s*=\s*['"`]([^'"`]+)['"`]/,
  key: /key\s*=\s*['"`]([^'"`]+)['"`]/
};

function extractVariable(source, varName) {
  const pattern = EXTRACT_PATTERNS[varName];
  if (!pattern) return '';
  const match = source.match(pattern);
  return match ? match[1] : '';
}

// ============================================
// FAST MANIFEST NAME EXTRACTION
// ============================================

function extractNameFromManifest(manifestUrl) {
  if (!manifestUrl) return '';

  try {
    const url = new URL(manifestUrl);
    const path = url.pathname;
    
    const mpdIdx = path.lastIndexOf('.mpd');
    const m3u8Idx = path.lastIndexOf('.m3u8');
    
    let endIdx = -1;
    if (mpdIdx > m3u8Idx) endIdx = mpdIdx;
    else if (m3u8Idx >= 0) endIdx = m3u8Idx;

    if (endIdx > -1) {
      let startIdx = path.lastIndexOf('/', endIdx);
      return path.slice(startIdx + 1, endIdx).replace(/_/g, ' ');
    }

    const parts = path.split('/');
    return parts[parts.length - 1] || 'Unknown';
  } catch (e) {
    return '';
  }
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

async function scrapeId(id) {
  const url = `https://avengers-iptv-web.hakunamata.workers.dev/?id=${id}`;

  try {
    const response = await fetchWithRetry(url);
    const $ = cheerio.load(response.data);

    const logo = $('.player-bottom-meta img.meta-logo').attr('src') || '';

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
      return { id, logo, status: 'failed_to_decode' };
    }

    const manifest = extractVariable(decodedScript, 'manifest');
    const name = extractNameFromManifest(manifest);

    return {
      id,
      name,
      logo,
      manifest,
      cookie: extractVariable(decodedScript, 'cookie'),
      keyid: extractVariable(decodedScript, 'keyid'),
      key: extractVariable(decodedScript, 'key'),
      status: 'success'
    };

  } catch (error) {
    return { id, status: 'error', error: error.message };
  }
}

// ============================================
// CONCURRENT BATCH PROCESSING
// ============================================

async function processBatch(ids, progressCallback) {
  const promises = ids.map(id => scrapeId(id));
  const results = [];

  for (let i = 0; i < promises.length; i += CONFIG.BATCH_SIZE) {
    const batch = promises.slice(i, i + CONFIG.BATCH_SIZE);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    
    if (progressCallback) {
      progressCallback(results.length, IDs.length);
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
  const writeStream = fs.createWriteStream('channels-fast.json');

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
    const batchResults = await Promise.all(chunk.map(id => scrapeId(id)));

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
  console.log(`📁 Saved to channels-fast.json`);
  
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
