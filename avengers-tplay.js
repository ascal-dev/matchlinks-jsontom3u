const axios = require('axios');

const cheerio = require('cheerio');

const fs = require('fs');

const https = require('https');

const http = require('http');



// ============================================

// ADVANCED CONFIGURATION

// ============================================



const CONFIG = {

  CONCURRENCY: 3,            // Further reduced to minimize 429 errors

  TIMEOUT: 8000,             // ms

  RETRY_ATTEMPTS: 7,         // More attempts for 429 errors

  BATCH_SIZE: 50,            // Process results in batches

  CACHE_MANIFEST: true,      // Cache decoded scripts

  CHUNK_SIZE: 100,           // Write results in chunks for memory efficiency

  REQUEST_DELAY: 500         // Increased delay between requests to avoid rate limiting

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
  },
  {
    "channel_id": "7",
    "Channel_name": "B4u Movies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-18-j5f9ui8g-v1/imageContent-18-j5f9ui8g-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "13",
    "Channel_name": "India News Haryana",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-8968-j7rcix2w-v1/imageContent-8968-j7rcix2w-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "31",
    "Channel_name": "Mazhavil Manorama",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-90-j5fjv4hk-v1/imageContent-90-j5fjv4hk-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "23",
    "Channel_name": "News18 Bangla",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-22186-jenuxy6g-v2/imageContent-22186-jenuxy6g-m5.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "3",
    "Channel_name": "Ruposhi Bangla",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-9-j5f6oezc-v1/imageContent-9-j5f6oezc-m1.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "11",
    "Channel_name": "Tv9 Telugu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-30-j5fc0v80-v2/imageContent-30-j5fc0v80-m2.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "25",
    "Channel_name": "Kairali Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-33-j5fc5fko-v1/imageContent-33-j5fc5fko-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "27",
    "Channel_name": "Ibc 24",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-78-j5fikkk8-v1/imageContent-78-j5fikkk8-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "10",
    "Channel_name": "Flowers",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Flowers_Thumbnail_541523f2-bbdd-45fd-a8cd-8e51b50cf733.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "24",
    "Channel_name": "Star Sports 1 Hindi Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-60-j5fdr6a0-v1/imageContent-60-j5fdr6a0-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "6",
    "Channel_name": "News18 Gujarati",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-15-j5f97j2o-v4/imageContent-15-j5f97j2o-m3.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "26",
    "Channel_name": "Colors Bangla",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ColorsBangla_Thumbnail_d1486eba-d00c-4e23-8f35-0ac95604aa1a.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "30",
    "Channel_name": "India News Up Uk",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-9007-j7ss7x80-v1/imageContent-9007-j7ss7x80-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1",
    "Channel_name": "India Today",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-3-j5dkuhwo-v1/imageContent-3-j5dkuhwo-m2.png",
    "Language": "English"
  },
  {
    "channel_id": "12",
    "Channel_name": "Anmol Cinema 2",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/AnmolCinema2_Thumbnail_a9d4932b-886b-423a-9376-7f00f50fd58b.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "14",
    "Channel_name": "India News Rajasthan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-9012-j7ssufeo-v1/imageContent-9012-j7ssufeo-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "52",
    "Channel_name": "Colors Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-155-j5frd2uo-v1/imageContent-155-j5frd2uo-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "53",
    "Channel_name": "Colors Cineplex",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-149-j5frd0jc-v2/imageContent-149-j5frd0jc-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "55",
    "Channel_name": "Travelxp",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-157-j5frd4e8-v1/imageContent-157-j5frd4e8-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "60",
    "Channel_name": "Dw",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-186-j5fsr1go-v1/imageContent-186-j5fsr1go-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "58",
    "Channel_name": "News18 Tamil Nadu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-192-j5fsr3s0-v1/imageContent-192-j5fsr3s0-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "37",
    "Channel_name": "Mega Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-111-j5fl5xo8-v1/imageContent-111-j5fl5xo8-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "44",
    "Channel_name": "Seithigal Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-126-j5fnf4ig-v2/imageContent-126-j5fnf4ig-m2.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "38",
    "Channel_name": "Aastha",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-105-j5fl5t1k-v1/imageContent-105-j5fl5t1k-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "43",
    "Channel_name": "Sanskar",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-123-j5fnf1fc-v1/imageContent-123-j5fnf1fc-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "48",
    "Channel_name": "Sony Sab Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-141-j5fpeji0-v3/imageContent-141-j5fpeji0-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "41",
    "Channel_name": "News18 Odia",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-13243-jbirprzs-v1/imageContent-13243-jbirprzs-m1.png",
    "Language": "Odia"
  },
  {
    "channel_id": "40",
    "Channel_name": "&tv Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/&tvHD_Thumbnail_72f7b0e7-e24a-4f50-a457-42380b344da9.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "49",
    "Channel_name": "T News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-145-j5fpfoe8-v1/imageContent-145-j5fpfoe8-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "2",
    "Channel_name": "Travel Xp - 4k",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-6-j5f5oyqw-v2/imageContent-6-j5f5oyqw-m2.png",
    "Language": "English"
  },
  {
    "channel_id": "61",
    "Channel_name": "Colors Cineplex Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-183-j5fsqz5c-v2/imageContent-183-j5fsqz5c-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "66",
    "Channel_name": "News18 Kerala",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12309-ja9ac8n4-v1/imageContent-12309-ja9ac8n4-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "71",
    "Channel_name": "Tata Play English In Hindi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-25721-jia4i70o-v2/imageContent-25721-jia4i70o-m3.PNG",
    "Language": "Hindi"
  },
  {
    "channel_id": "68",
    "Channel_name": "News18 Assam North East",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12390-jai3fgy0-v1/imageContent-12390-jai3fgy0-m1.png",
    "Language": "Others"
  },
  {
    "channel_id": "72",
    "Channel_name": "Republic Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-231-j5fxh0ag-v1/imageContent-231-j5fxh0ag-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "63",
    "Channel_name": "Zee Tv Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeTVHD._Thumbnail_39bf8ba9-ef02-465b-b800-ea1e222945d0.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "78",
    "Channel_name": "Star Sports 1 Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-8301-j7hc0820-v1/imageContent-8301-j7hc0820-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "65",
    "Channel_name": "Tv5 Monde Asie",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-204-j5ftndtc-v1/imageContent-204-j5ftndtc-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "73",
    "Channel_name": "Abp Asmita",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-228-j5fxgzio-v2/imageContent-228-j5fxgzio-m2.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "79",
    "Channel_name": "News18 Uttar Pradesh Uttarakhand",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-23223-jeyhnzfs-v1/imageContent-23223-jeyhnzfs-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "64",
    "Channel_name": "Anmol Cinema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/AnmolCinema_Thumbnail_6d666656-4ada-4ad5-a37b-cd9fe1e3be03.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "20",
    "Channel_name": "Zee Bihar Jharkhand",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeBiharJharkhand_Thumbnail_d1cd3a1d-ce4c-4549-ae7d-1fad8d2aa4e0.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "83",
    "Channel_name": "Etv Telangana",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-255-j5fz95pc-v1/imageContent-255-j5fz95pc-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "85",
    "Channel_name": "News18 Kannada",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-9824-j85wb88o-v1/imageContent-9824-j85wb88o-m1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "88",
    "Channel_name": "Et Now",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-6904-j6vreaps-v1/imageContent-6904-j6vreaps-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "87",
    "Channel_name": "Manorama News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ManoramaNews_Thumbnail_04ef240e-5362-4e85-a32e-07eced28af8a.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "90",
    "Channel_name": "Times Now",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-303-j5ji8zco-v3/imageContent-303-j5ji8zco-m3.png",
    "Language": "English"
  },
  {
    "channel_id": "99",
    "Channel_name": "D Tamil",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-44904-jzu8ri4o-v1/imageContent-44904-jzu8ri4o-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "100",
    "Channel_name": "Action Cinema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ActionCinema_Thumbnail_6f9ca756-7be8-484b-8f47-7a904c4765d5.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "33",
    "Channel_name": "Public Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-98-j5fjwu7s-v2/imageContent-98-j5fjwu7s-m3.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "98",
    "Channel_name": "Russia Today",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-312-j5jjsfhs-v1/imageContent-312-j5jjsfhs-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "97",
    "Channel_name": "Tv9 Marathi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-315-j5jjsht4-v2/imageContent-315-j5jjsht4-m2.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "92",
    "Channel_name": "Ptc Chak De",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-297-j5ji8qv4-v1/imageContent-297-j5ji8qv4-m1.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "95",
    "Channel_name": "Tata Play Javed Akhtar",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-304-j5ji9otc-v2/imageContent-304-j5ji9otc-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "91",
    "Channel_name": "Ptc News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-300-j5ji8seo-v1/imageContent-300-j5ji8seo-m1.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "93",
    "Channel_name": "Ndtv Profit Prime",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NDTPRNW_Thumbnail-v3/NDTPRNW_Thumbnail.png",
    "Language": "English"
  },
  {
    "channel_id": "101",
    "Channel_name": "Rang",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-333-j5jl5q6o-v1/imageContent-333-j5jl5q6o-m1.png",
    "Language": "Others"
  },
  {
    "channel_id": "102",
    "Channel_name": "Abp Ananda",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-321-j5jl5g5k-v2/imageContent-321-j5jl5g5k-m2.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "103",
    "Channel_name": "Mtv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-330-j5jl5on4-v2/imageContent-330-j5jl5on4-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "107",
    "Channel_name": "Colors Gujarati",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ColorsGujarati_Thumbnail_8d85c0a8-20d8-4ca1-acc6-02d914268427.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "104",
    "Channel_name": "India Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-8568-j7lnde80-v1/imageContent-8568-j7lnde80-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "106",
    "Channel_name": "News18 India",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-339-j5jm6kko-v1/imageContent-339-j5jm6kko-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "111",
    "Channel_name": "Tata Play Smart Manager",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-352-j5jmrkqw-v2/imageContent-352-j5jmrkqw-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "108",
    "Channel_name": "Colors Kannada",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ColorsKannada_Thumbnail_eff35da0-0ad8-4cdc-8fc3-04f0bcb470a1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "117",
    "Channel_name": "Food Food",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-384-j5jpj9hc-v1/imageContent-384-j5jpj9hc-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "118",
    "Channel_name": "Nick Jr",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/NickJr_Thumbnail_7d189eb7-d1fa-40c5-a5dd-30b95e3ee79d.png",
    "Language": "English"
  },
  {
    "channel_id": "119",
    "Channel_name": "Discovery Kids",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-24724-jgvwokqw-v1/imageContent-24724-jgvwokqw-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "113",
    "Channel_name": "Discovery Science",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-369-j5jo9i3s-v1/imageContent-369-j5jo9i3s-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "122",
    "Channel_name": "Ptc Punjabi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-408-j5jr93k8-v1/imageContent-408-j5jr93k8-m1.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "121",
    "Channel_name": "Tata Play Fitness",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-405-j5jr3sz4-v2/imageContent-405-j5jr3sz4-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "126",
    "Channel_name": "Epic",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/EPI_Thumbnail-v2/EPI_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "127",
    "Channel_name": "Sonic",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Sonic_Thumbnail_499a3f89-3733-4a5e-8a39-642a6eee5393.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "129",
    "Channel_name": "Aakaash Aath",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-267-j5j8x17s-v1/imageContent-267-j5j8x17s-m2.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "131",
    "Channel_name": "France 24",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-435-j5jsyz6o-v1/imageContent-435-j5jsyz6o-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "136",
    "Channel_name": "Good Times",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-42020-jxb7qjw8-v1/imageContent-42020-jxb7qjw8-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "134",
    "Channel_name": "Colors Marathi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-450-j5jtumug-v3/imageContent-450-j5jtumug-m3.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "138",
    "Channel_name": "Nick",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Nick_Thumbnail_5f31df62-5ae0-44ee-89c3-1e5f0b34d2c4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "96",
    "Channel_name": "Zoom",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-24696-jgrq09a8-v1/imageContent-24696-jgrq09a8-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "139",
    "Channel_name": "9xm",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-468-j5jwdbi8-v1/imageContent-468-j5jwdbi8-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "140",
    "Channel_name": "News18 Marathi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/NEWS18MARATHI_Thumbnail_74dbc4d4-c7f1-4a05-879f-f39963e903e5.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "123",
    "Channel_name": "Zee Cinema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeCinema_Thumbnail_df08abb5-8c94-474d-938b-358885158f58.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "146",
    "Channel_name": "Etv Andhra Pradesh",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-498-j5jy7i80-v1/imageContent-498-j5jy7i80-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "32",
    "Channel_name": "Sony Pix Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-93-j5fjv614-v3/imageContent-93-j5fjv614-m3.png",
    "Language": "English"
  },
  {
    "channel_id": "148",
    "Channel_name": "&pictures",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/&pictures_Thumbnail_e97d7fe7-842f-4033-9bb3-a99c11a1132c.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "8",
    "Channel_name": "Star Plus Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-25307-jhrhflww-v1/imageContent-25307-jhrhflww-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "152",
    "Channel_name": "Tv9 Kannada",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-531-j5kuelug-v2/imageContent-531-j5kuelug-m2.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "9",
    "Channel_name": "B4u Music",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-24-j5fb33y0-v1/imageContent-24-j5fb33y0-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "153",
    "Channel_name": "Aaj Tak",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-537-j5kwkd88-v1/imageContent-537-j5kwkd88-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "157",
    "Channel_name": "Channel News Asia",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-548-j5kxtaig-v1/imageContent-548-j5kxtaig-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "155",
    "Channel_name": "Abp Majha",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/STMJNW_Thumbnail-v3/STMJNW_Thumbnail.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "160",
    "Channel_name": "Ntv Telugu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-586-j5kz3qkw-v1/imageContent-586-j5kz3qkw-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "161",
    "Channel_name": "Channel Win",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-7906-j7684flk-v1/imageContent-7906-j7684flk-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "166",
    "Channel_name": "News18 Bihar Jharkhand",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-23206-jey39grs-v1/imageContent-23206-jey39grs-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "167",
    "Channel_name": "Tata Play Vedic Maths",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-703-j5l1wgco-v2/imageContent-703-j5l1wgco-m2.png",
    "Language": "English"
  },
  {
    "channel_id": "151",
    "Channel_name": "Tata Play Devotion",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/ARDLBR_Thumbnail-v1/ARDLBR_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "168",
    "Channel_name": "Cnbc Tv18",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-731-j5l3muhs-v1/imageContent-731-j5l3muhs-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "51",
    "Channel_name": "Dangal",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-158-j5frd560-v2/imageContent-158-j5frd560-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "174",
    "Channel_name": "Romedy Now",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-751-j5l5kb9k-v3/imageContent-751-j5l5kb9k-m3.png",
    "Language": "English"
  },
  {
    "channel_id": "175",
    "Channel_name": "Zee Bollywood",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeBollywood_Thumbnail_72e76b5f-2995-4089-853e-f932a8fe2ec0.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "177",
    "Channel_name": "Abp News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-759-j5m13014-v2/imageContent-759-j5m13014-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "178",
    "Channel_name": "Amrita Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-762-j5m21xqw-v1/imageContent-762-j5m21xqw-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "179",
    "Channel_name": "Ndtv India",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-483-j5jx9x48-v1/imageContent-483-j5jx9x48-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "180",
    "Channel_name": "Anjan Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-765-j5m2mbjk-v2/imageContent-765-j5m2mbjk-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "181",
    "Channel_name": "Bhojpuri Cinema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-768-j5m31cfs-v1/imageContent-768-j5m31cfs-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "183",
    "Channel_name": "India News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-774-j5m3h6nk-v1/imageContent-774-j5m3h6nk-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "187",
    "Channel_name": "Colors Infinity Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-1577-j5xrm7fc-v1/imageContent-1577-j5xrm7fc-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "188",
    "Channel_name": "Bbc News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BBCWNW_Thumbnail-v3/BBCWNW_Thumbnail.png",
    "Language": "English"
  },
  {
    "channel_id": "189",
    "Channel_name": "Newsx",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-8012-j7a2doxc-v1/imageContent-8012-j7a2doxc-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "191",
    "Channel_name": "Dd National",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-795-j5m7axrc-v1/imageContent-795-j5m7axrc-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "192",
    "Channel_name": "Fakt Marathi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-801-j5m7jg34-v2/imageContent-801-j5m7jg34-m2.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "193",
    "Channel_name": "Chardikla Time Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-792-j5m75dww-v1/imageContent-792-j5m75dww-m1.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "194",
    "Channel_name": "Dangal 2",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-798-j5m7esnc-v4/imageContent-798-j5m7esnc-m11.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "199",
    "Channel_name": "Jaya Max",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-807-j5m7zoyo-v1/imageContent-807-j5m7zoyo-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "200",
    "Channel_name": "Kalaignar Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-819-j5m8fsfs-v1/imageContent-819-j5m8fsfs-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "201",
    "Channel_name": "J Movies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-816-j5m8dqd4-v1/imageContent-816-j5m8dqd4-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "204",
    "Channel_name": "Cnbc Awaaz",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-846-j5m9p55k-v1/imageContent-846-j5m9p55k-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "205",
    "Channel_name": "News18 Rajasthan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-23226-jeyiac80-v1/imageContent-23226-jeyiac80-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "206",
    "Channel_name": "Cnn News18",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-843-j5m9oyzc-v1/imageContent-843-j5m9oyzc-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "207",
    "Channel_name": "News Time Bangla",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-852-j5m9xe80-v1/imageContent-852-j5m9xe80-m1.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "209",
    "Channel_name": "News 24",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-849-j5m9tmf4-v1/imageContent-849-j5m9tmf4-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "198",
    "Channel_name": "Jaya Plus",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-810-j5m84h14-v1/imageContent-810-j5m84h14-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "217",
    "Channel_name": "Sangeet Marathi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-870-j5mb6j80-v1/imageContent-870-j5mb6j80-m1.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "215",
    "Channel_name": "Sangeet Bangla",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-864-j5mava4o-v1/imageContent-864-j5mava4o-m1.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "173",
    "Channel_name": "Movies Now",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-748-j5l5fnts-v1/imageContent-748-j5l5fnts-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "212",
    "Channel_name": "Sansad Tv 2",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SANSTV2_Thumbnail-v2/SANSTV2_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "145",
    "Channel_name": "Etv Telugu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-492-j5jxvaeo-v1/imageContent-492-j5jxvaeo-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "221",
    "Channel_name": "Protidin Time",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-879-j5mdmlqw-v1/imageContent-879-j5mdmlqw-m1.png",
    "Language": "Others"
  },
  {
    "channel_id": "220",
    "Channel_name": "Puthiya Thalaimurai",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-882-j5mdrg4o-v1/imageContent-882-j5mdrg4o-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "211",
    "Channel_name": "Kairali News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-855-j5ma1eig-v2/imageContent-855-j5ma1eig-m2.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "203",
    "Channel_name": "News18 Madhya Pradesh Chhattisgarh",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-23266-jez523so-v1/imageContent-23266-jez523so-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "213",
    "Channel_name": "Sansad Tv 1",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SANSTV1_Thumbnail-v3/SANSTV1_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "223",
    "Channel_name": "Dd Sports",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-941-j5mhk5fc-v1/imageContent-941-j5mhk5fc-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "224",
    "Channel_name": "E24",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-946-j5mip6a0-v1/imageContent-946-j5mip6a0-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "225",
    "Channel_name": "Abn Andhra Jyothy",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-951-j5mipdzs-v1/imageContent-951-j5mipdzs-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "135",
    "Channel_name": "Tlc",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-453-j5jtup5s-v2/imageContent-453-j5jtup5s-m2.png",
    "Language": "English"
  },
  {
    "channel_id": "229",
    "Channel_name": "Surya Movies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-1008-j5nfqjeo-v1/imageContent-1008-j5nfqjeo-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "231",
    "Channel_name": "Udaya Movies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-1002-j5nf74c0-v1/imageContent-1002-j5nf74c0-m1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "227",
    "Channel_name": "Fashion Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-959-j5mipsnk-v1/imageContent-959-j5mipsnk-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "230",
    "Channel_name": "Surya Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-1005-j5nfiy9c-v1/imageContent-1005-j5nfiy9c-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "228",
    "Channel_name": "Discovery Turbo",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-967-j5mr8tw8-v1/imageContent-967-j5mr8tw8-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "232",
    "Channel_name": "News18 Punjab Haryana",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/News18PunjabHaryana_Thumbnail_5592540a-7d28-4c13-b06e-0ccb907dd236.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "226",
    "Channel_name": "News Live",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-956-j5mipkxs-v1/imageContent-956-j5mipkxs-m1.png",
    "Language": "Others"
  },
  {
    "channel_id": "238",
    "Channel_name": "Cartoon Network",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11161-j99h67u8-v1/imageContent-11161-j99h67u8-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "239",
    "Channel_name": "Pogo",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-2694-j638bugw-v1/imageContent-2694-j638bugw-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "233",
    "Channel_name": "Jai Maharashtra",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-1014-j5ngcjug-v2/imageContent-1014-j5ngcjug-m2.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "243",
    "Channel_name": "Cnn International",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-4154-j69pdmvk-v1/imageContent-4154-j69pdmvk-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "235",
    "Channel_name": "Star Sports 2 Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-1021-j5nj3c68-v1/imageContent-1021-j5nj3c68-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "244",
    "Channel_name": "Star Bharat Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-6895-j6vqhqnc-v2/imageContent-6895-j6vqhqnc-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "130",
    "Channel_name": "Animal Planet",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-432-j5jsx754-v4/imageContent-432-j5jsx754-m4.png",
    "Language": "English"
  },
  {
    "channel_id": "245",
    "Channel_name": "Star Gold Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SGHD_Thumbnail-v2/SGHD_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "251",
    "Channel_name": "Zee Marathi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeMarathi_Thumbnail_aa4c82ef-2920-4e13-bcdb-687b44a43278.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "252",
    "Channel_name": "Zee Cinemalu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeCinemalu_Thumbnail_f6f12a57-7de8-4de5-8678-8d3785e2ec99.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "254",
    "Channel_name": "Zee Bangla Sonar",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeBanglaSonar_Thumbnail_f3fe65a0-732b-488f-912a-2601da0f1217.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "250",
    "Channel_name": "Zee Telugu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeTelugu_Thumbnail_35eef881-3a61-421a-aa39-b70375e1dd06.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "255",
    "Channel_name": "Wion",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-9000-j7rkz0m0-v1/imageContent-9000-j7rkz0m0-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "246",
    "Channel_name": "Star Sports Select 1 Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-7891-j75vq7k0-v1/imageContent-7891-j75vq7k0-m1.PNG",
    "Language": "English"
  },
  {
    "channel_id": "256",
    "Channel_name": "Zee Kannada",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeKannada_Thumbnail_0aa1ddde-4782-4ef9-98b0-e1104f1a94d1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "257",
    "Channel_name": "Zee Tamil",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeTamil_Thumbnail_b62e58bc-c989-46ea-8eda-f2d6480868b6.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "259",
    "Channel_name": "Zee News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeNews_Thumbnail_d8974e88-5532-4544-9596-8b5e3cfc7c7e.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "258",
    "Channel_name": "Zee 24 Ghanta",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Zee24Ghanta_Thumbnail_83351296-fce6-4d30-9c75-3df2aa3d5f68.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "249",
    "Channel_name": "Zee Talkies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeTalkies_Thumbnail_55094397-03e1-434b-a521-921506561c39.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "261",
    "Channel_name": "Zee 24 Taas",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/24Taas_Thumbnail_9c6a10e8-3c74-45bd-b1f7-fc1abc8310d3.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "262",
    "Channel_name": "Zee Delhi Ncr Haryana",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeDelhiNCRHaryana_Thumbnail_da8c3a60-62f3-4e9f-90f1-423c6ce8aac7.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "208",
    "Channel_name": "Ndtv 24x7",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-834-j5m9nrrs-v1/imageContent-834-j5m9nrrs-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "266",
    "Channel_name": "10 Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-17564-jclrk6pk-v1/imageContent-17564-jclrk6pk-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "260",
    "Channel_name": "Zee Business",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeBusiness._Thumbnail_14fa6388-c28c-4f98-af02-c2a9b630129b.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "267",
    "Channel_name": "&pictures Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/AndPicturesHD_Thumbnail_b69c8bc8-ebee-48fc-8d7e-d7e2d120855e.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "278",
    "Channel_name": "Good News Today",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11206-j9icarsw-v2/imageContent-11206-j9icarsw-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "272",
    "Channel_name": "Polimer Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11188-j9i480zc-v1/imageContent-11188-j9i480zc-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "274",
    "Channel_name": "V6 Telugu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11194-j9i4cz80-v1/imageContent-11194-j9i4cz80-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "269",
    "Channel_name": "Goodness",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11176-j9i3lv54-v2/imageContent-11176-j9i3lv54-m2.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "268",
    "Channel_name": "Etv Life",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/ETVLI_Thumbnail-v5/ETVLI_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "214",
    "Channel_name": "Rengoni Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-860-j5mao56o-v1/imageContent-860-j5mao56o-m1.png",
    "Language": "Others"
  },
  {
    "channel_id": "283",
    "Channel_name": "Aastha Bhajan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11212-j9icd8jc-v1/imageContent-11212-j9icd8jc-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "270",
    "Channel_name": "Janam Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11179-j9i3nhs8-v2/imageContent-11179-j9i3nhs8-m3.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "282",
    "Channel_name": "Angel Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11230-j9icx1i0-v1/imageContent-11230-j9icx1i0-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "285",
    "Channel_name": "Aradana Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11224-j9iclykw-v1/imageContent-11224-j9iclykw-m2.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "287",
    "Channel_name": "Animal Planet Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/AnimalPlanetHD_Thumbnail_1b51a3e5-0513-45bf-b17f-7f78d34ab56e.png",
    "Language": "English"
  },
  {
    "channel_id": "286",
    "Channel_name": "Apn News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-17573-jclve4rc-v1/imageContent-17573-jclve4rc-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "288",
    "Channel_name": "Dharma Sandesh",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/ARIH_Thumbnail-v2/ARIH_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "291",
    "Channel_name": "Bharat Samachar",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BSAMAA_Thumbnail-v1/BSAMAA_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "294",
    "Channel_name": "Asianet Plus",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11254-j9ixwlcg-v1/imageContent-11254-j9ixwlcg-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "293",
    "Channel_name": "Asianet Movies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11251-j9ixmaz4-v1/imageContent-11251-j9ixmaz4-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "290",
    "Channel_name": "Bhakti Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11242-j9irisyw-v2/imageContent-11242-j9irisyw-m2.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "297",
    "Channel_name": "Big Magic",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/BigMagic_Thumbnail_93c73886-2047-4afd-8bda-c8a7f694f30c.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "292",
    "Channel_name": "Asianet Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11246-j9iw5g74-v3/imageContent-11246-j9iw5g74-m3.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "305",
    "Channel_name": "Colors Bangla Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11287-j9j4tl2w-v2/imageContent-11287-j9j4tl2w-m3.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "303",
    "Channel_name": "Cnbc Bajaar",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11281-j9j4lf3k-v1/imageContent-11281-j9j4lf3k-m1.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "308",
    "Channel_name": "Colors Marathi Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-16764-jcix3xpc-v2/imageContent-16764-jcix3xpc-m2.PNG",
    "Language": "Marathi"
  },
  {
    "channel_id": "316",
    "Channel_name": "Dd Bharati",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/DDBH_Thumbnail-v2/DDBH_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "311",
    "Channel_name": "Ctvn Akd Plus",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11299-j9j61p1k-v1/imageContent-11299-j9j61p1k-m1.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "320",
    "Channel_name": "Tv5 News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11329-j9jot000-v2/imageContent-11329-j9jot000-m2.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "317",
    "Channel_name": "Dd Bihar",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11321-j9jlxaz4-v1/imageContent-11321-j9jlxaz4-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "321",
    "Channel_name": "Dd Chandana",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11338-j9jozdxs-v1/imageContent-11338-j9jozdxs-m1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "326",
    "Channel_name": "Dd Kisan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11350-j9jpk8pk-v1/imageContent-11350-j9jpk8pk-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "322",
    "Channel_name": "Dd News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/DDNW_Thumbnail-v3/DDNW_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "328",
    "Channel_name": "Dd Malayalam",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11354-j9jpno60-v1/imageContent-11354-j9jpno60-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "323",
    "Channel_name": "Dd Girnar",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11341-j9jpdu00-v1/imageContent-11341-j9jpdu00-m1.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "325",
    "Channel_name": "Dd Kashir",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11345-j9jpidkw-v1/imageContent-11345-j9jpidkw-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "330",
    "Channel_name": "Dd Madhya Pradesh",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11351-j9jpmdvc-v1/imageContent-11351-j9jpmdvc-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "324",
    "Channel_name": "Dd India",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/DDIND_Thumbnail.png-v4/DDIND_Thumbnail.png.png",
    "Language": "English"
  },
  {
    "channel_id": "329",
    "Channel_name": "Dd Manipur",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11357-j9jpoz8g-v1/imageContent-11357-j9jpoz8g-m1.png",
    "Language": "Assamese"
  },
  {
    "channel_id": "332",
    "Channel_name": "Dd Rajasthan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11375-j9jpws3k-v1/imageContent-11375-j9jpws3k-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "333",
    "Channel_name": "Dd Odia",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11366-j9jpvkw0-v1/imageContent-11366-j9jpvkw0-m1.png",
    "Language": "Odia"
  },
  {
    "channel_id": "336",
    "Channel_name": "Dd Sahyadri",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11378-j9jq0f9s-v1/imageContent-11378-j9jq0f9s-m1.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "331",
    "Channel_name": "Dd North East",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11363-j9jprc40-v1/imageContent-11363-j9jprc40-m1.png",
    "Language": "Others"
  },
  {
    "channel_id": "335",
    "Channel_name": "Dd Punjabi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11374-j9jpwgiw-v1/imageContent-11374-j9jpwgiw-m1.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "338",
    "Channel_name": "Dd Urdu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11384-j9jq29mo-v2/imageContent-11384-j9jq29mo-m3.png",
    "Language": "Urdu"
  },
  {
    "channel_id": "337",
    "Channel_name": "Dd Saptagiri",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11381-j9jq1pkg-v1/imageContent-11381-j9jq1pkg-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "342",
    "Channel_name": "R Kannada",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/RKANN_Thumbnail-v2/RKANN_Thumbnail.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "339",
    "Channel_name": "Dd Uttar Pradesh",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11389-j9jq2ybk-v1/imageContent-11389-j9jq2ybk-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "341",
    "Channel_name": "Discovery Hd World",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11396-j9jq7jg0-v1/imageContent-11396-j9jq7jg0-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "348",
    "Channel_name": "Harvest Tv 24x7",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-35638-jruyxl0g-v4/imageContent-35638-jruyxl0g-m7.PNG",
    "Language": "Malayalam"
  },
  {
    "channel_id": "334",
    "Channel_name": "Dd Tamil",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/DDTAM_Thumbnail-v2/DDTAM_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "344",
    "Channel_name": "Hindi Khabar",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11467-j9jr3k80-v2/imageContent-11467-j9jr3k80-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "349",
    "Channel_name": "Hm Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11470-j9jr4uio-v1/imageContent-11470-j9jr4uio-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "351",
    "Channel_name": "Divyavani Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/DivyavaniTV_Thumbnail_cd39d7aa-96de-438a-87a3-85c49633ff45.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "210",
    "Channel_name": "Mn+ Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-826-j5m9kx5c-v1/imageContent-826-j5m9kx5c-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "355",
    "Channel_name": "Gemini Tv Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11444-j9jqx6a8-v1/imageContent-11444-j9jqx6a8-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "358",
    "Channel_name": "Etv Abhiruchi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11417-j9jqpcnc-v1/imageContent-11417-j9jqpcnc-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "353",
    "Channel_name": "Dy 365",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11411-j9jqocds-v1/imageContent-11411-j9jqocds-m1.png",
    "Language": "Others"
  },
  {
    "channel_id": "354",
    "Channel_name": "News18 Jammu Kashmir Ladakh Himachal",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/News18JammuKashmirLadakhHimachal_Thumbnail_919447d8-813e-487e-8fa4-3f31a3ffb10c.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "362",
    "Channel_name": "Gemini Movies Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11438-j9jqvyaw-v1/imageContent-11438-j9jqvyaw-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "361",
    "Channel_name": "Gemini Life",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11437-j9jqv7ao-v2/imageContent-11437-j9jqv7ao-m2.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "365",
    "Channel_name": "Gulistan News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11455-j9jqz61k-v2/imageContent-11455-j9jqz61k-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "366",
    "Channel_name": "India News Punjab",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/INWPUB_Thumbnail-v2/INWPUB_Thumbnail.jpg",
    "Language": "Punjabi"
  },
  {
    "channel_id": "368",
    "Channel_name": "News Live Bangla",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/News%20Live%20Bangla_Thumbnail_c1d71b68-9bc3-4bae-8144-779d108d2268.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "359",
    "Channel_name": "Etv Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11418-j9jqpvxs-v1/imageContent-11418-j9jqpvxs-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "370",
    "Channel_name": "Jaihind Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11495-j9jtg2ns-v2/imageContent-11495-j9jtg2ns-m2.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "372",
    "Channel_name": "Jeevan Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12323-jaa5pzxs-v1/imageContent-12323-jaa5pzxs-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "190",
    "Channel_name": "Al Jazeera",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-789-j5m5m0uw-v1/imageContent-789-j5m5m0uw-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "371",
    "Channel_name": "Janta Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11502-j9jtlmi8-v3/imageContent-11502-j9jtlmi8-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "378",
    "Channel_name": "Kaumudy Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11524-j9jtu07c-v2/imageContent-11524-j9jtu07c-m2.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "375",
    "Channel_name": "Kalinga Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11513-j9jtooug-v1/imageContent-11513-j9jtooug-m1.png",
    "Language": "Odia"
  },
  {
    "channel_id": "377",
    "Channel_name": "Kappa Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11520-j9jtr0y8-v1/imageContent-11520-j9jtr0y8-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "373",
    "Channel_name": "Jinvani Channel",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11507-j9jto5k0-v1/imageContent-11507-j9jto5k0-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "379",
    "Channel_name": "Khushboo Bangla",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Khushboo%20Bangla_Thumbnail_c2a9d1a1-7307-4f82-acad-f79b28648534.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "384",
    "Channel_name": "Khabarain Abhi Tak",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11527-j9jtx9hk-v2/imageContent-11527-j9jtx9hk-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "380",
    "Channel_name": "Ktv Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11536-j9jty5w8-v1/imageContent-11536-j9jty5w8-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "381",
    "Channel_name": "Kolkata Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11533-j9jtxqgo-v1/imageContent-11533-j9jtxqgo-m1.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "385",
    "Channel_name": "Sharnam Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11547-j9ju62m8-v3/imageContent-11547-j9ju62m8-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "388",
    "Channel_name": "Star Maa Gold",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11553-j9julvag-v3/imageContent-11553-j9julvag-m6.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "387",
    "Channel_name": "Star Maa Movies Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-18348-jcqpx9ns-v1/imageContent-18348-jcqpx9ns-m1.PNG",
    "Language": "Telugu"
  },
  {
    "channel_id": "390",
    "Channel_name": "Madha Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11562-j9juzmns-v1/imageContent-11562-j9juzmns-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "400",
    "Channel_name": "Mega Musiq",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11583-j9jype8w-v3/imageContent-11583-j9jype8w-m3.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "392",
    "Channel_name": "Makkal Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11565-j9jv0np4-v1/imageContent-11565-j9jv0np4-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "395",
    "Channel_name": "Mazhavil Manorama Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11577-j9jv8mqg-v1/imageContent-11577-j9jv8mqg-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "391",
    "Channel_name": "Malaimurasu Seithigal",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/MAMUR_Thumbnail-v2/MAMUR_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "399",
    "Channel_name": "Mh One",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11586-j9jyt26w-v1/imageContent-11586-j9jyt26w-m1.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "394",
    "Channel_name": "Mathrubhumi News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11572-j9jv7wi0-v1/imageContent-11572-j9jv7wi0-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "408",
    "Channel_name": "Nambikkai Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11622-j9k0845k-v2/imageContent-11622-j9k0845k-m2.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "411",
    "Channel_name": "Murasu Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11616-j9k04eo0-v1/imageContent-11616-j9k04eo0-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "401",
    "Channel_name": "Mh One News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11587-j9jyvxl4-v1/imageContent-11587-j9jyvxl4-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "406",
    "Channel_name": "Mtv Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11610-j9jzore8-v2/imageContent-11610-j9jzore8-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "222",
    "Channel_name": "India News Mp Cg",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-8971-j7rffd40-v1/imageContent-8971-j7rffd40-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "414",
    "Channel_name": "News 1 India",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11634-j9k0pbr4-v1/imageContent-11634-j9k0pbr4-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "415",
    "Channel_name": "News 11 Bharat",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NEW11B_Thumbnail-v4/NEW11B_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "421",
    "Channel_name": "Peppers Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11667-j9kdkb6w-v1/imageContent-11667-j9kdkb6w-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "417",
    "Channel_name": "North East Live",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11644-j9k1gjow-v1/imageContent-11644-j9k1gjow-m1.png",
    "Language": "Others"
  },
  {
    "channel_id": "420",
    "Channel_name": "Peace Of Mind",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11664-j9kcouh4-v1/imageContent-11664-j9kcouh4-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "423",
    "Channel_name": "Prag News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11673-j9kfe73s-v1/imageContent-11673-j9kfe73s-m1.png",
    "Language": "Others"
  },
  {
    "channel_id": "234",
    "Channel_name": "Mnx",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-1017-j5ngpo2g-v1/imageContent-1017-j5ngpo2g-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "418",
    "Channel_name": "Colors Tamil",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-21152-je6orzfk-v1/imageContent-21152-je6orzfk-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "428",
    "Channel_name": "Raj News Malayalam",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11694-j9kjc0tc-v1/imageContent-11694-j9kjc0tc-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "429",
    "Channel_name": "Raj Musix Telugu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11691-j9kj50i0-v1/imageContent-11691-j9kj50i0-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "424",
    "Channel_name": "Public Music",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11676-j9khi3cw-v1/imageContent-11676-j9khi3cw-m1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "426",
    "Channel_name": "Raj Digital Plus",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11679-j9khnqag-v1/imageContent-11679-j9khnqag-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "427",
    "Channel_name": "Raj Musix Kannada",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11685-j9kipky0-v1/imageContent-11685-j9kipky0-m2.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "425",
    "Channel_name": "Raj Musix",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11682-j9khxjoo-v1/imageContent-11682-j9khxjoo-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "430",
    "Channel_name": "Raj News Telugu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11697-j9kjhxs0-v3/imageContent-11697-j9kjhxs0-m3.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "431",
    "Channel_name": "Oscar Movies Bhojpuri",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/OSMOV_Thumbnail-v3/OSMOV_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "439",
    "Channel_name": "Raj Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11700-j9ksbotk-v1/imageContent-11700-j9ksbotk-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "433",
    "Channel_name": "Nick Hd+",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/NickHDPlus_Thumbnail_c2d3ac26-019f-4f66-9dec-8c1228f92ddf.png",
    "Language": "English"
  },
  {
    "channel_id": "438",
    "Channel_name": "Colors Rishtey",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/RIS_Thumbnail-v3/RIS_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "436",
    "Channel_name": "Safari Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11709-j9kt6bg0-v1/imageContent-11709-j9kt6bg0-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "248",
    "Channel_name": "Zee Yuva",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeYuva_Thumbnail_17ddd027-8cd0-43ce-8017-d78723c37fc6.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "444",
    "Channel_name": "Travelxp Tamil",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11724-j9kvwnkg-v1/imageContent-11724-j9kvwnkg-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "446",
    "Channel_name": "Paras Gold One",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11725-j9kw030w-v4/imageContent-11725-j9kw030w-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "445",
    "Channel_name": "Subhavaarta Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11745-j9kwb568-v2/imageContent-11745-j9kwb568-m3.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "448",
    "Channel_name": "News7",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11733-j9kw4100-v4/imageContent-11733-j9kw4100-m4.png",
    "Language": "English"
  },
  {
    "channel_id": "447",
    "Channel_name": "Sadhna Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11746-j9kwfmfs-v2/imageContent-11746-j9kwfmfs-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "449",
    "Channel_name": "Ramdhenu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11728-j9kw1zp4-v1/imageContent-11728-j9kw1zp4-m1.png",
    "Language": "Others"
  },
  {
    "channel_id": "455",
    "Channel_name": "Sathiyam Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11764-j9kwqj6o-v1/imageContent-11764-j9kwqj6o-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "456",
    "Channel_name": "Satsang Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11767-j9kwretk-v1/imageContent-11767-j9kwretk-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "457",
    "Channel_name": "Shalom Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11772-j9kwsqns-v1/imageContent-11772-j9kwsqns-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "467",
    "Channel_name": "Star Suvarna Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11816-j9kz224o-v1/imageContent-11816-j9kz224o-m1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "468",
    "Channel_name": "Star Jalsha Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/STJHD_Thumbnail-v3/STJHD_Thumbnail.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "474",
    "Channel_name": "Sun Life",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11837-j9kzms9s-v2/imageContent-11837-j9kzms9s-m3.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "458",
    "Channel_name": "Shubh Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11775-j9kwuk8w-v1/imageContent-11775-j9kwuk8w-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "469",
    "Channel_name": "Star Pravah Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11807-j9kyzle8-v1/imageContent-11807-j9kyzle8-m1.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "477",
    "Channel_name": "Sri Sankara Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11788-j9kypa94-v1/imageContent-11788-j9kypa94-m2.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "480",
    "Channel_name": "Tlc Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11858-j9l1v6k8-v3/imageContent-11858-j9l1v6k8-m4.png",
    "Language": "English"
  },
  {
    "channel_id": "484",
    "Channel_name": "Travelxp Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11862-j9l2p61c-v1/imageContent-11862-j9l2p61c-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "314",
    "Channel_name": "Dd Bangla",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11314-j9j8kcxk-v1/imageContent-11314-j9j8kcxk-m1.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "486",
    "Channel_name": "Tata Play Bollywood Premiere",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-43899-jyofyk1s-v4/imageContent-43899-jyofyk1s-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "485",
    "Channel_name": "Total Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11859-j9l2n36w-v2/imageContent-11859-j9l2n36w-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "489",
    "Channel_name": "Tv9 Gujarati",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11874-j9l376yg-v2/imageContent-11874-j9l376yg-m2.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "492",
    "Channel_name": "Udaya Tv Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11883-j9l3rjzc-v1/imageContent-11883-j9l3rjzc-m1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "496",
    "Channel_name": "Star Vijay Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11909-j9l52epk-v2/imageContent-11909-j9l52epk-m4.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "219",
    "Channel_name": "Discovery Channel",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-876-j5mcolzc-v2/imageContent-876-j5mcolzc-m2.png",
    "Language": "English"
  },
  {
    "channel_id": "490",
    "Channel_name": "Svbc 2",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11882-j9l3qcrs-v1/imageContent-11882-j9l3qcrs-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "500",
    "Channel_name": "Vedic",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11903-j9l4wxy8-v1/imageContent-11903-j9l4wxy8-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "501",
    "Channel_name": "Zee Marathi Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeMarathiHD_Thumbnail_5b67ab98-df69-46f9-902a-528a21d60e28.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "497",
    "Channel_name": "Vtv News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11912-j9l58n8w-v2/imageContent-11912-j9l58n8w-m4.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "499",
    "Channel_name": "Vasanth Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11900-j9l4vygg-v1/imageContent-11900-j9l4vygg-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "503",
    "Channel_name": "Zee Cinema Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeCinemaHD_Thumbnail_1b4c5f52-d57a-4d05-b862-21daf2428223.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "509",
    "Channel_name": "Polimer News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11942-j9lthi34-v1/imageContent-11942-j9lthi34-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "510",
    "Channel_name": "Raj News Kannada",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11948-j9ltrfc8-v1/imageContent-11948-j9ltrfc8-m1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "514",
    "Channel_name": "Zee Bharat",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeBharat_Thumbnail_fabb0a0c-2fb6-4d97-8827-60d11dedd363.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "512",
    "Channel_name": "Zee Madhya Pradesh Chattisgarh",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZEEMPCG_Thumbnail_73bc476e-f497-4e3b-9213-c4c4797c961b.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "507",
    "Channel_name": "Zee 24 Kalak",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Zee24Kalak_Thumbnail_319532e6-1894-43e2-b889-8bc84c2daabf.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "516",
    "Channel_name": "Star Maa Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-25361-jhsvr3nc-v1/imageContent-25361-jhsvr3nc-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "521",
    "Channel_name": "Sun Tv Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11960-j9lu9vow-v1/imageContent-11960-j9lu9vow-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "518",
    "Channel_name": "Salaam Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/ZESA_Thumbnail-v4/ZESA_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "524",
    "Channel_name": "Thanthi Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11966-j9luich4-v1/imageContent-11966-j9luich4-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "517",
    "Channel_name": "Zing",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Zing_Thumbnail_b8adf6f0-f786-4d48-9fc6-110fd5445ca9.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "525",
    "Channel_name": "Raj News Tamil.",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12002-j9nrtf08-v2/imageContent-12002-j9nrtf08-m2.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "522",
    "Channel_name": "Zee Bangla Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeBanglaHD_Thumbnail_abd318d8-03d0-44c9-a18d-b34a5d941a48.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "515",
    "Channel_name": "Zee Talkies Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeTalkiesHD_Thumbnail_b5e4946f-52f6-445b-aab1-329fe307b44c.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "523",
    "Channel_name": "Anmol Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/AnmolTV_Thumbnail_af80da7c-abb9-4b93-a769-c3d887bfee61.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "376",
    "Channel_name": "Kanak News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12271-j9to48zc-v1/imageContent-12271-j9to48zc-m2.png",
    "Language": "Odia"
  },
  {
    "channel_id": "532",
    "Channel_name": "Asianet News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12020-j9ntf12w-v1/imageContent-12020-j9ntf12w-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "537",
    "Channel_name": "Jalsha Movies Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11514-j9jtp5tk-v1/imageContent-11514-j9jtp5tk-m2.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "541",
    "Channel_name": "Raj Musix Malayalam",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11688-j9kiz1zs-v1/imageContent-11688-j9kiz1zs-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "543",
    "Channel_name": "Colors",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Colors_Thumbnail_7faf1cde-35f3-4c88-9afd-d820ce21513e.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "540",
    "Channel_name": "Star Suvarna Plus",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12038-j9o0554o-v2/imageContent-12038-j9o0554o-m2.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "533",
    "Channel_name": "Colors Super",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ColorsSUPER_Thumbnail_5796a912-57d4-4093-98e6-0ac42fde8efe.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "547",
    "Channel_name": "Times Now World",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11853-j9l1tvhs-v4/imageContent-11853-j9l1tvhs-m5.png",
    "Language": "English"
  },
  {
    "channel_id": "546",
    "Channel_name": "Saam Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12056-j9o5hia8-v1/imageContent-12056-j9o5hia8-m1.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "551",
    "Channel_name": "Star Utsav",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12060-j9o91vfc-v2/imageContent-12060-j9o91vfc-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "548",
    "Channel_name": "Dd Yadagiri",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11392-j9jq3lgw-v3/imageContent-11392-j9jq3lgw-m2.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "553",
    "Channel_name": "We Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12065-j9o9phqg-v1/imageContent-12065-j9o9phqg-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "552",
    "Channel_name": "Gujarat Samachar Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12068-j9o9t9jc-v1/imageContent-12068-j9o9t9jc-m1.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "544",
    "Channel_name": "Colors Infinity",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-18305-jcqmvp7s-v1/imageContent-18305-jcqmvp7s-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "562",
    "Channel_name": "Movies Now Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12095-j9ooixfs-v1/imageContent-12095-j9ooixfs-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "559",
    "Channel_name": "Sony Sab",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12081-j9oc38xc-v8/imageContent-12081-j9oc38xc-m7.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "475",
    "Channel_name": "Sudarshan News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11831-j9kzkn40-v1/imageContent-11831-j9kzkn40-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "577",
    "Channel_name": "Swaraj Express Smbc",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12143-j9p7vx9c-v1/imageContent-12143-j9p7vx9c-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "576",
    "Channel_name": "Media One",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/MEON_Thumbnail-v3/MEON_Thumbnail.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "567",
    "Channel_name": "Nepal 1",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12106-j9ooxpug-v2/imageContent-12106-j9ooxpug-m2.png",
    "Language": "Others"
  },
  {
    "channel_id": "578",
    "Channel_name": "&tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/&TV_Thumbnail_c5160b3d-5d18-43d8-afab-f1cac5604432.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "571",
    "Channel_name": "Tata Play Punjab De Rang",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-68739-kywk7vq0-v1/imageContent-68739-kywk7vq0-m1.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "583",
    "Channel_name": "Zee Rajasthan News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeRajasthanNews_Thumbnail_adfc39a7-ed91-4ac7-9038-86e43a2786a1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "580",
    "Channel_name": "Zee Punjab Haryana Himachal Pradesh",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeePunjabHaryanaHimachalPradesh_Thumbnail_6b1187a1-8e12-42b6-9eba-746b9234cd1e.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "594",
    "Channel_name": "Ishwar Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12196-j9q3ez54-v1/imageContent-12196-j9q3ez54-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "608",
    "Channel_name": "Zee Tamil Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeTamilHD_Thumbnail_7022fe5b-89a2-4cca-a9d0-58e46baa6d5c.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "596",
    "Channel_name": "Sakshi Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12260-j9qv0lz4-v1/imageContent-12260-j9qv0lz4-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "585",
    "Channel_name": "Vissa Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12164-j9phk5iw-v1/imageContent-12164-j9phk5iw-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "591",
    "Channel_name": "Mirror Now",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12189-j9plqlf4-v1/imageContent-12189-j9plqlf4-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "586",
    "Channel_name": "Sandesh News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12167-j9phnio0-v2/imageContent-12167-j9phnio0-m2.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "557",
    "Channel_name": "Zee Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeTV_Thumbnail_bbdc885f-e029-4df8-bdca-c781610a595d.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "597",
    "Channel_name": "Zee Sarthak",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeSarthak_Thumbnail_2ae93af1-571b-4eee-8089-96a5bffba646.png",
    "Language": "Odia"
  },
  {
    "channel_id": "599",
    "Channel_name": "Mnx Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12216-j9qm5hjs-v2/imageContent-12216-j9qm5hjs-m2.png",
    "Language": "English"
  },
  {
    "channel_id": "555",
    "Channel_name": "Asianet Suvarna News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11963-j9lui4rc-v3/imageContent-11963-j9lui4rc-m4.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "613",
    "Channel_name": "News State Up Uttarakhand",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12252-j9qrkgu8-v3/imageContent-12252-j9qrkgu8-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "611",
    "Channel_name": "Sirippoli",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12244-j9qq7k1c-v1/imageContent-12244-j9qq7k1c-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "614",
    "Channel_name": "Tata Play Bangla Cinema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12043-j9o0gcog-v2/imageContent-12043-j9o0gcog-m5.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "618",
    "Channel_name": "Tata Play Beauty",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12282-ja02jlp4-v2/imageContent-12282-ja02jlp4-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "612",
    "Channel_name": "Colors Kannada Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ColorsKannadaHD_Thumbnail_46b9c73f-0883-47d5-84dc-b52fabc9010d.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "627",
    "Channel_name": "Tata Play Fun Learn Junior",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-13097-jbdzn9og-v2/imageContent-13097-jbdzn9og-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "629",
    "Channel_name": "Tv5 Kannada",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-19066-jczvvocg-v1/imageContent-19066-jczvvocg-m1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "622",
    "Channel_name": "Tata Play Marathi Cinema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-12925-jb5xf2nc-v2/imageContent-12925-jb5xf2nc-m2.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "626",
    "Channel_name": "Tata Play Fun Learn Rhymes",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/TataPlayFunLearnRhymes_Thumbnail_ff9ce71d-5fab-49b2-8ddf-f1708870f4bb.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "630",
    "Channel_name": "Hindu Dharmam",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-18536-jct505dc-v2/imageContent-18536-jct505dc-m2.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "434",
    "Channel_name": "Jothi Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11712-j9kt9fbs-v2/imageContent-11712-j9kt9fbs-m2.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "635",
    "Channel_name": "Zee Telugu Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeTeluguHD_Thumbnail_a1d8805e-c97c-429c-9447-7cc21c82dd29.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "641",
    "Channel_name": "Tata Play Cooking",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-23495-jf92iycg-v3/imageContent-23495-jf92iycg-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "643",
    "Channel_name": "News State Mp Cg",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-31191-jldnwhhs-v1/imageContent-31191-jldnwhhs-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "645",
    "Channel_name": "Tata Play English In Telugu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-23721-jg0fhacg-v2/imageContent-23721-jg0fhacg-m2.PNG",
    "Language": "Telugu"
  },
  {
    "channel_id": "647",
    "Channel_name": "Isaiaruvi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-24578-jgotgry0-v1/imageContent-24578-jgotgry0-m1.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "632",
    "Channel_name": "Star Gold Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-19212-jd2xwa4w-v1/imageContent-19212-jd2xwa4w-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "636",
    "Channel_name": "Zee Cinemalu Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeCinemaluHD_Thumbnail_a891db6e-facc-4e8f-8599-975cf9dd7c13.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "646",
    "Channel_name": "Dd Gyan Darshan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-23855-jg9jt83c-v2/imageContent-23855-jg9jt83c-m8.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "650",
    "Channel_name": "First India Rajasthan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-25048-jhir0kko-v1/imageContent-25048-jhir0kko-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "661",
    "Channel_name": "Public Movies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-31188-jldk0joo-v2/imageContent-31188-jldk0joo-m2.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "652",
    "Channel_name": "Bansal News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-25494-ji1a6ym0-v2/imageContent-25494-ji1a6ym0-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "654",
    "Channel_name": "India News Gujarat",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-26589-jj9w5h54-v1/imageContent-26589-jj9w5h54-m2.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "648",
    "Channel_name": "Calcutta News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-24685-jgrl9bqg-v1/imageContent-24685-jgrl9bqg-m2.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "659",
    "Channel_name": "Vendhar Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-31187-jldgeg1k-v2/imageContent-31187-jldgeg1k-m2.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "667",
    "Channel_name": "Colors Kannada Cinema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ColorsKannadaCinema_Thumbnail_13c0f128-c9cd-4321-af65-18fa22686307.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "666",
    "Channel_name": "Tata Play Theatre Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-31419-jmb48u74-v3/imageContent-31419-jmb48u74-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "684",
    "Channel_name": "Zee Keralam",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeKeralam_Thumbnail_135b04d9-eb23-478b-85d1-c722b522cee2.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "674",
    "Channel_name": "Colors Tamil Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-33814-jo5jba9s-v3/imageContent-33814-jo5jba9s-m3.PNG",
    "Language": "Tamil"
  },
  {
    "channel_id": "685",
    "Channel_name": "India Voice",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-34516-jp9bj0qg-v4/imageContent-34516-jp9bj0qg-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "675",
    "Channel_name": "Zee Kannada Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeKannadaHD_Thumbnail_94ab8ecd-e907-4aba-aa21-d22896bcb961.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "681",
    "Channel_name": "Cartoon Network Hd+",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/CartoonNetworkHD%2B_Thumbnail_659c99be-8487-48d8-b5b1-cec0963a64e3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "677",
    "Channel_name": "Tata Play Shortstv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-34170-jok0hf00-v7/imageContent-34170-jok0hf00-m8.PNG",
    "Language": "Hindi"
  },
  {
    "channel_id": "689",
    "Channel_name": "Aaj Tak Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-34652-jpmey8gw-v1/imageContent-34652-jpmey8gw-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "691",
    "Channel_name": "Dd News Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-34886-jqc7dybs-v2/imageContent-34886-jqc7dybs-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "692",
    "Channel_name": "Colors Gujarati Cinema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-35306-jqxwmaeo-v1/imageContent-35306-jqxwmaeo-m2.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "694",
    "Channel_name": "Zee Keralam Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeKeralamHD_Thumbnail_2f42c29f-2a09-4c98-bc4e-85ddb1860eed.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "702",
    "Channel_name": "News J",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-37207-jswmhmpk-v1/imageContent-37207-jswmhmpk-m1.PNG",
    "Language": "Tamil"
  },
  {
    "channel_id": "698",
    "Channel_name": "Inh 24x7",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-35622-jrr5mvig-v1/imageContent-35622-jrr5mvig-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "696",
    "Channel_name": "R Bharat",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-35599-jrm11j9c-v1/imageContent-35599-jrm11j9c-m1.PNG",
    "Language": "Hindi"
  },
  {
    "channel_id": "706",
    "Channel_name": "Tv9 Bharatvarsh",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/TV9Bharatvarsh_Thumbnail_5fb28599-4efd-42fb-991d-c08382526803.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "708",
    "Channel_name": "Jaya Tv Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-38738-juc4a1ig-v5/imageContent-38738-juc4a1ig-m8.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "624",
    "Channel_name": "Pitaara Movies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/PITAA_Thumbnail-v2/PITAA_Thumbnail.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "730",
    "Channel_name": "B4u Kadak",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/B4UKad_Thumbnail-v5/B4UKad_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "701",
    "Channel_name": "Jantantra Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-37210-jswmlty0-v2/imageContent-37210-jswmlty0-m2.PNG",
    "Language": "Hindi"
  },
  {
    "channel_id": "727",
    "Channel_name": "Zee Classic",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeClassic_Thumbnail_8a0a88d4-484a-464c-a991-0084bbf33cd6.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "731",
    "Channel_name": "Manoranjan Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-43106-jxzlt6x4-v2/imageContent-43106-jxzlt6x4-m7.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "729",
    "Channel_name": "B4u Bhojpuri",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-43109-jxzlyrjc-v1/imageContent-43109-jxzlyrjc-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "733",
    "Channel_name": "Showbox",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/Showbox_Thumbnail-v2/Showbox_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "741",
    "Channel_name": "Tata Play Classic Cinema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-44333-jz3hpme0-v4/imageContent-44333-jz3hpme0-m8.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "637",
    "Channel_name": "Zee Uttar Pradesh Uttarakhand",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeUttarPradeshUttarakhand_Thumbnail_513daf30-e5e2-4e24-83b2-a4ad73060ea7.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "735",
    "Channel_name": "Tata Play Ibaadat",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-44321-jz2zb8pk-v3/imageContent-44321-jz2zb8pk-m3.png",
    "Language": "Urdu"
  },
  {
    "channel_id": "742",
    "Channel_name": "Tata Play Aradhana",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TSARAD_Thumbnail-v6/TSARAD_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "772",
    "Channel_name": "Tata Play Gujarati Cinema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-47224-k1uh5c4g-v2/imageContent-47224-k1uh5c4g-m2.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "758",
    "Channel_name": "Dd Arunprabha",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-44752-jzn44a8w-v1/imageContent-44752-jzn44a8w-m10.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "744",
    "Channel_name": "Tata Play Comedy",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-44395-jz3uw5q0-v3/imageContent-44395-jz3uw5q0-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "774",
    "Channel_name": "4tv News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-47248-k1vn9ouw-v2/imageContent-47248-k1vn9ouw-m4.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "782",
    "Channel_name": "Namma Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-47615-k2jwaqug-v1/imageContent-47615-k2jwaqug-m3.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "783",
    "Channel_name": "Tata Play Seniors",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-47647-k2lbp2q8-v2/imageContent-47647-k2lbp2q8-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "789",
    "Channel_name": "Tata Play Hollywood Local",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-48748-k4jbpl00-v2/imageContent-48748-k4jbpl00-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "788",
    "Channel_name": "Enterr10 Bangla",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-48494-k3zd1a80-v1/imageContent-48494-k3zd1a80-m4.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "787",
    "Channel_name": "Anb News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-48498-k3zd4bsg-v1/imageContent-48498-k3zd4bsg-m3.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "796",
    "Channel_name": "Zee Punjabi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeePunjabi_Thumbnail_e4b58470-bced-4b23-9ede-90b46cd343a6.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "773",
    "Channel_name": "Ptc Simran",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-47242-k1vmve74-v1/imageContent-47242-k1vmve74-m2.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "793",
    "Channel_name": "Living India News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-57445-kg7p5yk8-v2/imageContent-57445-kg7p5yk8-m3.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "799",
    "Channel_name": "Twenty Four",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-49022-k5lxarmw-v2/imageContent-49022-k5lxarmw-m2.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "794",
    "Channel_name": "Ptc Punjabi Gold",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-48860-k4nlxy14-v2/imageContent-48860-k4nlxy14-m2.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "791",
    "Channel_name": "Fateh Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-48804-k4m7nz2w-v1/imageContent-48804-k4m7nz2w-m1.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "800",
    "Channel_name": "Shemaroo Marathibana",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-49025-k5lxf84o-v2/imageContent-49025-k5lxf84o-m2.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "805",
    "Channel_name": "Nandighosha Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-49597-k6k8ts8g-v2/imageContent-49597-k6k8ts8g-m2.png",
    "Language": "Odia"
  },
  {
    "channel_id": "660",
    "Channel_name": "Ayush Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11257-j9iy8oj4-v2/imageContent-11257-j9iy8oj4-m2.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "807",
    "Channel_name": "In Goa 24x7",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-49633-k6lny7mw-v1/imageContent-49633-k6lny7mw-m1.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "397",
    "Channel_name": "Mh One Shraddha",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11590-j9jyx4so-v1/imageContent-11590-j9jyx4so-m1.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "811",
    "Channel_name": "Tata Play Adbhut Kahaniyan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-52369-k7e829a0-v5/imageContent-52369-k7e829a0-m5.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "810",
    "Channel_name": "Zee Power",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeePower_Thumbnail_18bac6f1-c93c-4dd1-b673-d6c0b9e7732f.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "816",
    "Channel_name": "Cbeebies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-52868-k9af4lxs-v1/imageContent-52868-k9af4lxs-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "821",
    "Channel_name": "Headlines Tripura",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-53817-kbgn42ww-v1/imageContent-53817-kbgn42ww-m2.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "814",
    "Channel_name": "Zee Biskope",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeBiskope_Thumbnail_ad98896c-f74c-440d-959c-380de0993744.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "823",
    "Channel_name": "Goldmines",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-53943-kblsqraw-v3/imageContent-53943-kblsqraw-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "818",
    "Channel_name": "Shemaroo Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-52945-ka1wdss8-v2/imageContent-52945-ka1wdss8-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "819",
    "Channel_name": "Rdx Goa",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-53443-kanbrwjs-v1/imageContent-53443-kanbrwjs-m1.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "824",
    "Channel_name": "Power Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-53941-kblrui1c-v3/imageContent-53941-kblrui1c-m3.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "775",
    "Channel_name": "Divya",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-11408-j9jqmlvs-v6/imageContent-11408-j9jqmlvs-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "827",
    "Channel_name": "Sadhna Plus News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-55124-kd89b0f4-v1/imageContent-55124-kd89b0f4-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "829",
    "Channel_name": "Sadhna News Mp Cg",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-55112-kd88u9so-v1/imageContent-55112-kd88u9so-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "837",
    "Channel_name": "Hare Krsna",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/HareKrsna_Thumbnail-v1/HareKrsna_Thumbnail.png",
    "Language": "English"
  },
  {
    "channel_id": "435",
    "Channel_name": "Sai Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/SAITV_Thumbnail_c18b3dd5-b2eb-4049-b8fb-53b7408440bb.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "838",
    "Channel_name": "Kashish News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/KashishNews_Thumbnail_48c9b9a0-b8a7-4b6c-a2aa-55c92b071cfe.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "840",
    "Channel_name": "Shirdi Sai Baba",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-56386-kfc14w60-v4/imageContent-56386-kfc14w60-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "842",
    "Channel_name": "Somnath Temple",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-56389-kfdgngts-v3/imageContent-56389-kfdgngts-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "848",
    "Channel_name": "Network 10",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-56488-kfgbqzso-v3/imageContent-56488-kfgbqzso-m5.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "833",
    "Channel_name": "Dd Port Blair",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-55741-kedqsz9k-v1/imageContent-55741-kedqsz9k-m2.png",
    "Language": "English"
  },
  {
    "channel_id": "867",
    "Channel_name": "Gubbare",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-57985-khvdchrs-v2/imageContent-57985-khvdchrs-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "865",
    "Channel_name": "Bangla Bhakti",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BBHAKTI_Thumbnail-v3/BBHAKTI_Thumbnail.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "870",
    "Channel_name": "Jan Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-58492-kixkb2ug-v1/imageContent-58492-kixkb2ug-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "872",
    "Channel_name": "Tata Play Astro Duniya",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-58613-kj283ly8-v2/imageContent-58613-kj283ly8-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "873",
    "Channel_name": "Tv9 Bangla",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-59401-kjudpa1c-v2/imageContent-59401-kjudpa1c-m3.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "883",
    "Channel_name": "Swar Shree",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-60933-kljn4c9c-v1/imageContent-60933-kljn4c9c-m1.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "879",
    "Channel_name": "Sportyfy",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-59662-kk73wwmo-v1/imageContent-59662-kk73wwmo-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "887",
    "Channel_name": "Garv Gurbani",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-60927-kljn2znc-v1/imageContent-60927-kljn2znc-m1.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "888",
    "Channel_name": "Ishara",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/Ishara_Thumbnail-v3/Ishara_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "890",
    "Channel_name": "Republic Bangla",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-61251-klylf4u0-v2/imageContent-61251-klylf4u0-m9.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "893",
    "Channel_name": "Tata Play Valam Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TPVALM_Thumbnail-v2/TPVALM_Thumbnail.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "896",
    "Channel_name": "Colors Bangla Cinema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/CLRBANG_Thumbnail-v6/CLRBANG_Thumbnail.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "894",
    "Channel_name": "Nktv Plus",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NKTVPLUS_Thumbnail-v2/NKTVPLUS_Thumbnail.png",
    "Language": "Assamese"
  },
  {
    "channel_id": "898",
    "Channel_name": "Hornbill Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/HORNBLTV_Thumbnail-v2/HORNBLTV_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "899",
    "Channel_name": "Pasand",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-62150-knicubns-v2/imageContent-62150-knicubns-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "902",
    "Channel_name": "News 24 Madhyapradesh Chattisgarh",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-62181-knrp5974-v1/imageContent-62181-knrp5974-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "907",
    "Channel_name": "Argus News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-62573-kop7duow-v6/imageContent-62573-kop7duow-m9.png",
    "Language": "Odia"
  },
  {
    "channel_id": "866",
    "Channel_name": "Tara News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-57969-khu0zsnc-v1/imageContent-57969-khu0zsnc-m1.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "812",
    "Channel_name": "Eurosport Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/EurosportHD_Thumbnail_61c45f7e-f67d-482f-8dc2-ae993aaa56c6.png",
    "Language": "English"
  },
  {
    "channel_id": "908",
    "Channel_name": "Nimbark Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-62599-koxtswe0-v1/imageContent-62599-koxtswe0-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "910",
    "Channel_name": "C News Bharat",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-62607-koxuikrs-v1/imageContent-62607-koxuikrs-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "911",
    "Channel_name": "Santwani",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-62610-koxujv2g-v2/imageContent-62610-koxujv2g-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "928",
    "Channel_name": "Tata Play Neet Prep",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-64066-kra2j2qo-v2/imageContent-64066-kra2j2qo-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "913",
    "Channel_name": "News 1st Kannada",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NWS1ST_Thumbnail-v3/NWS1ST_Thumbnail.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "929",
    "Channel_name": "Tata Play Jee Prep",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-64069-kra2o75k-v2/imageContent-64069-kra2o75k-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "930",
    "Channel_name": "Buletin India",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-59645-kk72iwh4-v3/imageContent-59645-kk72iwh4-m3.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "931",
    "Channel_name": "Green Chillies Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-64523-krkg6p88-v1/imageContent-64523-krkg6p88-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "922",
    "Channel_name": "Ptc Music",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-63498-kqq89g5k-v2/imageContent-63498-kqq89g5k-m3.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "932",
    "Channel_name": "Times Now Navbharat Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-64606-krslbshs-v1/imageContent-64606-krslbshs-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "849",
    "Channel_name": "Kashi Vishwanath Temple, Varanasi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/KSVW_Thumbnail-v8/KSVW_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "944",
    "Channel_name": "Live Iskcon Vrindavan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-65966-ku6es6wo-v4/imageContent-65966-ku6es6wo-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "937",
    "Channel_name": "Anaadi Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-65108-ksr7d028-v1/imageContent-65108-ksr7d028-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "943",
    "Channel_name": "Tata Play K-dramas",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Tata%20Play%20K-Dramas_Thumbnail_66a84c4c-ef6f-4d17-a16d-94c109eb2bdb.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "950",
    "Channel_name": "Et Now Swadesh",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-66223-ku9gfjug-v1/imageContent-66223-ku9gfjug-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "940",
    "Channel_name": "Sirikannada Alltime",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-65190-ktai1xtk-v1/imageContent-65190-ktai1xtk-m1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "953",
    "Channel_name": "Asianet Plus",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-66564-kup0jo0w-v1/imageContent-66564-kup0jo0w-m3.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "947",
    "Channel_name": "Live Patna Sahib Patna",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-65977-ku6g2hko-v3/imageContent-65977-ku6g2hko-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "954",
    "Channel_name": "Star Maa Gold",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-66595-kupdpd9k-v1/imageContent-66595-kupdpd9k-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "966",
    "Channel_name": "Times Now Navbharat",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-67796-kx7lokw8-v2/imageContent-67796-kx7lokw8-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "960",
    "Channel_name": "Atmadarshan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-67700-kwoeo240-v2/imageContent-67700-kwoeo240-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "965",
    "Channel_name": "Manoranjan Grand",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-67799-kx7m7rhc-v1/imageContent-67799-kx7m7rhc-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "956",
    "Channel_name": "Star Maa Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-66705-kuqnqhwg-v1/imageContent-66705-kuqnqhwg-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "957",
    "Channel_name": "Star Maa Movies Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-66770-kuwalqkg-v1/imageContent-66770-kuwalqkg-m1.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "964",
    "Channel_name": "Tata Play Classic Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TPCTV_Thumbnail-v4/TPCTV_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "923",
    "Channel_name": "Travelxp 4k Hdr",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-63764-kr1kzw28-v2/imageContent-63764-kr1kzw28-m2.png",
    "Language": "English"
  },
  {
    "channel_id": "912",
    "Channel_name": "Haryana Beats",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-62613-koxw351c-v1/imageContent-62613-koxw351c-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "633",
    "Channel_name": "Investigation Discovery",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-49002-k5cch1cg-v2/imageContent-49002-k5cch1cg-m5.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "967",
    "Channel_name": "Tch 100 Binge",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-68791-kyzh69bs-v1/imageContent-68791-kyzh69bs-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "933",
    "Channel_name": "Asianet Movies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-64891-ks8v01o8-v1/imageContent-64891-ks8v01o8-m2.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "968",
    "Channel_name": "News Tamil 24x7",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-69018-kzo65wi0-v1/imageContent-69018-kzo65wi0-m2.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "969",
    "Channel_name": "Aadinath Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-69024-kzo68h3c-v1/imageContent-69024-kzo68h3c-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "693",
    "Channel_name": "Eurosport",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Eurosport_Thumbnail_cd041080-2457-40af-b402-26b0f8839b21.png",
    "Language": "English"
  },
  {
    "channel_id": "974",
    "Channel_name": "1st Gujarat",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/1STGUJ_Thumbnail-v2/1STGUJ_Thumbnail.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "972",
    "Channel_name": "Khabar Fast",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-69238-kzt9ig3k-v1/imageContent-69238-kzt9ig3k-m2.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "971",
    "Channel_name": "Svbc 3",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-69020-kzo676so-v1/imageContent-69020-kzo676so-m1.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "986",
    "Channel_name": "Tata Play Zindagi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-70821-l3edt8uw-v1/imageContent-70821-l3edt8uw-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "976",
    "Channel_name": "Nhk World Japan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-69827-l1dh5izk-v1/imageContent-69827-l1dh5izk-m1.png",
    "Language": "English"
  },
  {
    "channel_id": "658",
    "Channel_name": "Sony Marathi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-30959-jky1nic8-v2/imageContent-30959-jky1nic8-m3.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "998",
    "Channel_name": "Tata Play Toons+",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TONSPUN_Thumbnail-v4/TONSPUN_Thumbnail.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "994",
    "Channel_name": "Tata Play Toons+",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-71550-l4zi50uw-v2/imageContent-71550-l4zi50uw-m5.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "959",
    "Channel_name": "Tata Play Romance",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-67692-kwmxxw08-v2/imageContent-67692-kwmxxw08-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "980",
    "Channel_name": "Star Sports 2 Hindi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/StarSports2Hindi_Thumbnail_dbbed3ca-8b98-4ca2-b3ec-f3eb99c7683c.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "356",
    "Channel_name": "God Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/GodTV_Thumbnail_3645875a-a9bc-4003-96bd-4d6fc451ec40.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "978",
    "Channel_name": "Sidharth Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-69926-l1ooghuw-v3/imageContent-69926-l1ooghuw-m3.png",
    "Language": "Odia"
  },
  {
    "channel_id": "935",
    "Channel_name": "Awakening",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-65100-kspm2814-v1/imageContent-65100-kspm2814-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "997",
    "Channel_name": "Tata Play Toons+",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TONSTAM_Thumbnail-v6/TONSTAM_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "999",
    "Channel_name": "Tata Play Toons+",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TONSMAR_Thumbnail-v10/TONSMAR_Thumbnail.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "995",
    "Channel_name": "Tata Play Toons+",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TONSBEN_Thumbnail-v5/TONSBEN_Thumbnail.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "1009",
    "Channel_name": "Tv27 News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-72340-l6nkcw74-v1/imageContent-72340-l6nkcw74-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1004",
    "Channel_name": "Shri Ganga Aarti, Varanasi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-72303-l6hqin9k-v1/imageContent-72303-l6hqin9k-m2.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1002",
    "Channel_name": "Saileela Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-72161-l60vjz1c-v3/imageContent-72161-l60vjz1c-m3.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1000",
    "Channel_name": "Colors Cineplex Bollywood",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-71752-l5hqgxso-v2/imageContent-71752-l5hqgxso-m1.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1010",
    "Channel_name": "Bharat 24",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BH24_Thumbnail-v3/BH24_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1018",
    "Channel_name": "Real News Kerala",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-73022-l8gzppv4-v1/imageContent-73022-l8gzppv4-m1.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "1030",
    "Channel_name": "Food Xp",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-73664-l98odjh4-v1/imageContent-73664-l98odjh4-m7.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1003",
    "Channel_name": "Tata Play South Talkies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-72254-l6dn8nco-v3/imageContent-72254-l6dn8nco-m4.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1033",
    "Channel_name": "Star Sports 2 Hindi Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/StarSports2HindiHD_Thumbnail_ec95554a-d24d-49f3-a1a0-498662e26b3a.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "996",
    "Channel_name": "Tata Play Toons+",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TONSTEL_Thumbnail-v4/TONSTEL_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1040",
    "Channel_name": "Jansetu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/JANS_Thumbnail-v1/JANS_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1042",
    "Channel_name": "Bless Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BLSTV_Thumbnail-v1/BLSTV_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1044",
    "Channel_name": "Global India",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/GBIN_Thumbnail-v1/GBIN_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1051",
    "Channel_name": "Bharat Express",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BHEXP_Thumbnail-v2/BHEXP_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1045",
    "Channel_name": "Shemaroo Umang",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SHEUM_Thumbnail-v2/SHEUM_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1050",
    "Channel_name": "Goldmines Bollywood",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/GoldminesBollywood_Thumbnail_4ce8ca2b-ef06-484a-89d2-a950a8d02616.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "991",
    "Channel_name": "Dd Meghalaya",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-71497-l4stx05k-v3/imageContent-71497-l4stx05k-m5.png",
    "Language": "Assamese"
  },
  {
    "channel_id": "1053",
    "Channel_name": "Asian News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/ASIANN_Thumbnail-v1/ASIANN_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1073",
    "Channel_name": "Tata Play Telugu Classics",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TPTECL_Thumbnail-v1/TPTECL_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1070",
    "Channel_name": "Media 9",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/MEDI9_Thumbnail-v1/MEDI9_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1058",
    "Channel_name": "Aaj Ki Khabar",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/AAJKK_Thumbnail-v1/AAJKK_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1076",
    "Channel_name": "Asom Live 24",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/AsomLive24_Thumbnail_86e3d6ed-42b2-45e8-bcb6-42990332f6dd.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "1078",
    "Channel_name": "Daily Post Punjab Haryana Himachal",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/DailyPostPunjabHaryanaHimachal_Thumbnail_f1ed4969-fbf2-4545-aff1-b5868b6cfad0.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "1059",
    "Channel_name": "Indian News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/INDNWS_Thumbnail-v1/INDNWS_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1079",
    "Channel_name": "Ttn 24",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TTN24_Thumbnail-v2/TTN24_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "830",
    "Channel_name": "Filamchi Bhojpuri",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-55553-kdzetu0o-v3/imageContent-55553-kdzetu0o-m8.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1099",
    "Channel_name": "Prime9 Plus",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/PR9NEWS_Thumbnail-v4/PR9NEWS_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1100",
    "Channel_name": "Big Tv Telugu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BGTVTEL_Thumbnail-v2/BGTVTEL_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1080",
    "Channel_name": "U Bangla Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/UBANTV_Thumbnail-v1/UBANTV_Thumbnail.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "1124",
    "Channel_name": "Reporter Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/RETV_Thumbnail-v2/RETV_Thumbnail.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "1102",
    "Channel_name": "Pudhari News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/PDNEWS_Thumbnail-v2/PDNEWS_Thumbnail.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "1082",
    "Channel_name": "Tata Play Asomiya Monoronjan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/ASMON_Thumbnail-v1/ASMON_Thumbnail.png",
    "Language": "Assamese"
  },
  {
    "channel_id": "1008",
    "Channel_name": "Iskcon Temple, Pune",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ISKCONTemple%2CPune_Thumbnail_e6076cae-02bf-4171-a1c2-036ffa28cb7e.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1130",
    "Channel_name": "Tata Play Bollywood Masala",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BMSLA_Thumbnail-v2/BMSLA_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1135",
    "Channel_name": "Vanitha",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/VANITHA_Thumbnail-v1/VANITHA_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1152",
    "Channel_name": "Ndtv Rajasthan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NDTVRA_Thumbnail-v3/NDTVRA_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1132",
    "Channel_name": "Rongeen Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/RONGEEN_Thumbnail-v1/RONGEEN_Thumbnail.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "826",
    "Channel_name": "Lokshahi Marathi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/LKSHIMAR_Thumbnail-v4/LKSHIMAR_Thumbnail.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "1151",
    "Channel_name": "Mahaa News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/MHNEWS_Thumbnail-v1/MHNEWS_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1084",
    "Channel_name": "India Daily 24x7",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/",
    "Language": "Hindi"
  },
  {
    "channel_id": "1159",
    "Channel_name": "Ndtv Mpcg",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NDTVMP_Thumbnail-v2/NDTVMP_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1136",
    "Channel_name": "Bloomberg Television",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BLOOTE_Thumbnail-v1/BLOOTE_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1166",
    "Channel_name": "Chithiram",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/CHITHIRAM_Thumbnail_934ac678-6d04-458b-adb8-9bc1e1df9307.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1168",
    "Channel_name": "Tata Play Hollywood Local Telugu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TPHLTE_Thumbnail-v5/TPHLTE_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1169",
    "Channel_name": "Jay Jagannath.",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/JJAG_Thumbnail-v1/JJAG_Thumbnail.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1167",
    "Channel_name": "Tata Play Hollywood Local Tamil",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TPHLT_Thumbnail-v4/TPHLT_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1170",
    "Channel_name": "Sidharth Gold",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SIDGL_Thumbnail-v2/SIDGL_Thumbnail.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1019",
    "Channel_name": "7x Music",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/imageContent-73019-l8gzpnjs-v1/imageContent-73019-l8gzpnjs-m1.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "1186",
    "Channel_name": "Star Sports 2 Telugu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/StarSports2Telugu_Thumbnail_1fbdf427-a065-46df-8e7a-174e34f76f44.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1187",
    "Channel_name": "Star Sports 2 Tamil",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/StarSports2Tamil_Thumbnail_62ccb7be-f9e6-49c0-8382-7ee6a812fe50.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1199",
    "Channel_name": "Ekamra  Music",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/EKMUS_Thumbnail-v1/EKMUS_Thumbnail.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1196",
    "Channel_name": "Ekamra Bharat Odia",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/EKMBHO_Thumbnail-v1/EKMBHO_Thumbnail.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1198",
    "Channel_name": "Ekamra Cynema",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/EKMCYN_Thumbnail-v1/EKMCYN_Thumbnail.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1201",
    "Channel_name": "Ekamra Paramatma",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/EKMPRM_Thumbnail-v1/EKMPRM_Thumbnail.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1202",
    "Channel_name": "Ekamra One Paschima",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/EKMOPS_Thumbnail-v1/EKMOPS_Thumbnail.jpg",
    "Language": "Odia"
  },
  {
    "channel_id": "1200",
    "Channel_name": "Ekamra Jatra",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/EKMJAT_Thumbnail-v1/EKMJAT_Thumbnail.png",
    "Language": "Odia"
  },
  {
    "channel_id": "797",
    "Channel_name": "Zee Thirai",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeThirai_Thumbnail_96ccd831-12bb-47e6-b57f-5e0a71ccf81b.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1204",
    "Channel_name": "Kalinga Bharat",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/KALBHA_Thumbnail-v3/KALBHA_Thumbnail.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1205",
    "Channel_name": "Lokmanch",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Lokmanch_Thumbnail_a2e76a9b-c938-4fc7-99ca-dab23a14bf2f.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1207",
    "Channel_name": "Ekamra Manoranjan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/EKMMNR_Thumbnail-v1/EKMMNR_Thumbnail.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1208",
    "Channel_name": "Rajya 24",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Rajya24_Thumbnail_7e9249b5-f02d-42ef-a16d-087e14334d10.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1212",
    "Channel_name": "Dd Haryana",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/DDHY_Thumbnail-v1/DDHY_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1210",
    "Channel_name": "Dd Tripura",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/DDTP_Thumbnail-v1/DDTP_Thumbnail.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "1209",
    "Channel_name": "Samrat News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/SamratNews_Thumbnail_9a57ed45-2382-4a83-91b3-808d5acfe1ba.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1217",
    "Channel_name": "Dd Himachal",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/DDHC_Thumbnail-v1/DDHC_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1211",
    "Channel_name": "Dd Mizoram",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/DDMZ_Thumbnail-v1/DDMZ_Thumbnail.png",
    "Language": "Others"
  },
  {
    "channel_id": "1213",
    "Channel_name": "Dd Uttarakhand",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/DDUK_Thumbnail-v1/DDUK_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1215",
    "Channel_name": "Dd Goa",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/DDGOA_Thumbnail-v1/DDGOA_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1242",
    "Channel_name": "In24 News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/IN24NEWS_Thumbnail-v1/IN24NEWS_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1247",
    "Channel_name": "35 Mm",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/35MM_Thumbnail-v1/35MM_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1246",
    "Channel_name": "Vande Bharat News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/VANDEBHNEWS_Thumbnail-v1/VANDEBHNEWS_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1164",
    "Channel_name": "Unique Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/UNIQ_Thumbnail-v4/UNIQ_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1260",
    "Channel_name": "Tata Play Tamil Classics",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TPTAMCL_Thumbnail-v1/TPTAMCL_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1269",
    "Channel_name": "Shemaroo Josh",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ShemarooJosh_Thumbnail_6d89e92b-633f-422f-a011-432129c05c41.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1276",
    "Channel_name": "Investigation Discovery Hd",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/InvestigationDiscoveryHD_Thumbnail_c628b7d4-5cd1-471f-ba84-d171fae140ae.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1274",
    "Channel_name": "Swadesh News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SWANEWS_Thumbnail-v4/SWANEWS_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1197",
    "Channel_name": "Ekamra Nilachakra",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/EKMNIL_Thumbnail-v1/EKMNIL_Thumbnail.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1267",
    "Channel_name": "Hnn News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/HNNNEWS_Thumbnail-v1/HNNNEWS_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1281",
    "Channel_name": "Samachar 24 News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SAM24NEWS_Thumbnail-v1/SAM24NEWS_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1285",
    "Channel_name": "Sana Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SANATV_Thumbnail-v2/SANATV_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1278",
    "Channel_name": "Prime Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/PRIMETV_Thumbnail.png-v2/PRIMETV_Thumbnail.png.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1287",
    "Channel_name": "Zee Kannada News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/ZeeKannadaNews_Thumbnail_14338d4f-bf0a-4b10-8a65-6b2e8f35b4f0.png",
    "Language": "Kannada"
  },
  {
    "channel_id": "1206",
    "Channel_name": "Lni",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/LNI_Thumbnail_326f5d4f-aabf-4f15-a9db-4a9e3df9d32d.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1288",
    "Channel_name": "Zee Telugu News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/ZTELNEWS_Thumbnail-v1/ZTELNEWS_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1286",
    "Channel_name": "News Capital",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/newscap_Thumbnail-v1/newscap_Thumbnail.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "1284",
    "Channel_name": "Sana Plus Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SANPLTV_Thumbnail-v1/SANPLTV_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1299",
    "Channel_name": "Engage - Star Cam",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/EngageCaptainCam_Thumbnail-v1/EngageCaptainCam_Thumbnail.png",
    "Language": "English"
  },
  {
    "channel_id": "1313",
    "Channel_name": "Shekinah",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SHEKINAH_Thumbnail-v2/SHEKINAH_Thumbnail.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "1317",
    "Channel_name": "Tamil Janam",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TAMILJNM_Thumbnail-v6/TAMILJNM_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1322",
    "Channel_name": "Thanthi One",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/THANTIO_Thumbnail-v4/THANTIO_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1321",
    "Channel_name": "All Time Movies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/ATMOV_Thumbnail-v1/ATMOV_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1315",
    "Channel_name": "Vistaar News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/VISTAARMPCG_Thumbnail-v2/VISTAARMPCG_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1332",
    "Channel_name": "Ab Star News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/ABSTAR_Thumbnail-v1/ABSTAR_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1335",
    "Channel_name": "Shiksha Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SHIKHA_Thumbnail-v1/SHIKHA_Thumbnail.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "1333",
    "Channel_name": "Abc News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/ABCNE_Thumbnail-v1/ABCNE_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1337",
    "Channel_name": "Sristi Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SHRISTI_Thumbnail-v1/SHRISTI_Thumbnail.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "1344",
    "Channel_name": "Naxatra News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NAXNEWS_Thumbnail-v1/NAXNEWS_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1343",
    "Channel_name": "Ndtv Marathi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NDTVMAR_Thumbnail-v1/NDTVMAR_Thumbnail.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "1350",
    "Channel_name": "Tata Play Lakshya Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TPLKSH_Thumbnail-v1/TPLKSH_Thumbnail.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "1364",
    "Channel_name": "Powervision",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/POWERVISN_Thumbnail-v1/POWERVISN_Thumbnail.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "1330",
    "Channel_name": "Raj Pariwar",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/RAJPARI_Thumbnail-v3/RAJPARI_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1367",
    "Channel_name": "News Malayalam 24x7",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NEWSMAL_Thumbnail-v1/NEWSMAL_Thumbnail.png",
    "Language": "Malayalam"
  },
  {
    "channel_id": "1376",
    "Channel_name": "Bs Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BS_TV_Thumbnail-v1/BS_TV_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1372",
    "Channel_name": "Bhaktisagar",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BKSR_Thumbnail-v1/BKSR_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1378",
    "Channel_name": "Nireekshana Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NRKHNTV_Thumbnail-v1/NRKHNTV_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1371",
    "Channel_name": "Bvg",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BVG_Thumbnail-v1/BVG_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1380",
    "Channel_name": "News 21",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/News21_Thumbnail-v1/News21_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1334",
    "Channel_name": "Kbc News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/KBCNE_Thumbnail-v1/KBCNE_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1382",
    "Channel_name": "Dharsan Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/DHARSANTV_Thumbnail_00d86c82-3377-4994-98c9-db06df6dd782.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1339",
    "Channel_name": "Tnp News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TNPNEW_Thumbnail-v1/TNPNEW_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1392",
    "Channel_name": "Sadvidya",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SADV_Thumbnail-v1/SADV_Thumbnail.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "1386",
    "Channel_name": "Ntv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NTVPUT_Thumbnail-v1/NTVPUT_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1389",
    "Channel_name": "Mahaa Max",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/MAHAMAX_Thumbnail-v2/MAHAMAX_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1388",
    "Channel_name": "Utv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/UTVLOC_Thumbnail-v1/UTVLOC_Thumbnail.jpg",
    "Language": "Tamil"
  },
  {
    "channel_id": "1385",
    "Channel_name": "Subin Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/SUBINTV_Thumbnail-v1/SUBINTV_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1395",
    "Channel_name": "Live Times",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/LIVETIMES_Thumbnail-v2/LIVETIMES_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1400",
    "Channel_name": "Sadhna Prime News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/SadhnaPrimeNews_Thumbnail_69babd41-2e1d-4521-92ba-7fc3d04ef24f.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1352",
    "Channel_name": "Pear Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/PEARTV_Thumbnail-v1/PEARTV_Thumbnail.png",
    "Language": "Assamese"
  },
  {
    "channel_id": "1411",
    "Channel_name": "News State Punjab Haryana Himachal",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NewsStatePunjabHaryanaHimachal_Thumbnail-v1/NewsStatePunjabHaryanaHimachal_Thumbnail.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "1383",
    "Channel_name": "Nijam Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NIJAMTV_Thumbnail-v1/NIJAMTV_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1194",
    "Channel_name": "Brk News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BRKNEWS_Thumbnail-v1/BRKNEWS_Thumbnail.png",
    "Language": "Telugu"
  },
  {
    "channel_id": "1444",
    "Channel_name": "Tata Play Marathi Classics",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TPMARCLS_Thumbnail-v1/TPMARCLS_Thumbnail.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "1448",
    "Channel_name": "24hrs Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/24HrsTV_Thumbnail-v1/24HrsTV_Thumbnail.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "1463",
    "Channel_name": "Express News Bharat",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/ExpressBharat_Thumbnail-v1/ExpressBharat_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1468",
    "Channel_name": "Navsarjan Sanskruti Gujarati",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NAVSAR_Thumbnail-v2/NAVSAR_Thumbnail.png",
    "Language": "Gujarati"
  },
  {
    "channel_id": "1460",
    "Channel_name": "Bhi Channel",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/BHIChannel_Thumbnail-v1/BHIChannel_Thumbnail.png",
    "Language": "Bengali"
  },
  {
    "channel_id": "1459",
    "Channel_name": "Tata Play Deiveegam",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TPDeiveegam_Thumbnail-v1/TPDeiveegam_Thumbnail.png",
    "Language": "Tamil"
  },
  {
    "channel_id": "1486",
    "Channel_name": "Anand Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Anand%20TV_Thumbnail_384dd72b-cfc5-4090-9482-4ebf553291c8.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1470",
    "Channel_name": "News Nation 81",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/NEW81_Thumbnail-v4/NEW81_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1499",
    "Channel_name": "Goldmines Movies",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/GoldminesMovies_Thumbnail_de06b8fe-ec61-4f81-9151-87a13e515368.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1785",
    "Channel_name": "Tata Play Bhakti Sangeet",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/TataPlayBhaktiSangeet_Thumbnail_0e40f07a-87ac-4462-aefd-0b64bd84f92e.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1752",
    "Channel_name": "Delta 140823_21.0",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/",
    "Language": "Hindi"
  },
  {
    "channel_id": "1489",
    "Channel_name": "Tata Play Fancode Sports",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/TataPlayFancodeSports_Thumbnail_3d37ca9e-c6df-42b4-a863-0824bb13c1d7.png",
    "Language": "English"
  },
  {
    "channel_id": "1786",
    "Channel_name": "Tata Play Fancode Sports +1",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/TataPlayFancodeSports_Thumbnail_cfae9074-7f83-4832-a0b3-ae147197ce05.png",
    "Language": "English"
  },
  {
    "channel_id": "1787",
    "Channel_name": "Tata Play Cartoon Network Forever",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/TataPlayCartoonNetworkForever_Thumbnail_edf800a9-9bbb-4e12-8b63-09970f96d63c.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1796",
    "Channel_name": "Voice Tv Urdu",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/VoiceTVUrdu_Thumbnail_ee64af54-6860-405a-986f-278ee802fdaa.png",
    "Language": "Urdu"
  },
  {
    "channel_id": "1445",
    "Channel_name": "Tar Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TarTV_Thumbnail-v1/TarTV_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1487",
    "Channel_name": "Newsx World",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/NewsX%20World_Thumbnail_bb4454f5-d6ab-4130-b199-0dff65bb267d.png",
    "Language": "English"
  },
  {
    "channel_id": "1795",
    "Channel_name": "Aagaaz Times",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/AagaazTimes_Thumbnail_51b49b0f-760a-42ee-bf48-46740ad74b4c.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1797",
    "Channel_name": "Smriti Patra",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/SmritiPatra_Thumbnail_5ca8c53a-9f7c-41b2-b47f-6ff73e04040f.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1818",
    "Channel_name": "Mirror Media",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/MirrorMedia_Thumbnail_371a6853-ad2d-4247-96d8-55dc5944cd5c.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1462",
    "Channel_name": "22 Scope",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/22Scope_Thumbnail-v1/22Scope_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1790",
    "Channel_name": "National Tv India",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/NationalTVIndia_Thumbnail_4b6668f7-92b4-4d1c-a2af-b4fdfbfdd0af.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1825",
    "Channel_name": "A One News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/AONENEWS_Thumbnail_322faf1e-bea1-42e6-aa6f-79d434f96188.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1821",
    "Channel_name": "Top News Marathi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/TopNewsMarathi_Thumbnail_792abfbd-acab-4caf-b9d6-88598300b9de.png",
    "Language": "Marathi"
  },
  {
    "channel_id": "1826",
    "Channel_name": "India 24x7 Live Tv",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/India24x7AapTak_Thumbnail_43c00f02-3084-4c7c-b138-1e1a33b95205.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1823",
    "Channel_name": "Prime Asia",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/PrimeAsia_Thumbnail_a1bcf5be-2582-4ef7-aaa2-99f47ef80398.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "1836",
    "Channel_name": "Gtc Punjabi",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/GTCPunjabi_Thumbnail_865f1468-5bbb-42af-b2bb-61b7bf23758f.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "1824",
    "Channel_name": "Nsc9",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/NSC9_Thumbnail_0be4f715-2e67-481a-ba70-ef3efcbe5aed.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1835",
    "Channel_name": "Tata Play Odia Manoranjan",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/TataPlayOdiaManoranjan_Thumbnail_03fcd184-8b4b-43a7-b0d3-218b0434b247.png",
    "Language": "Odia"
  },
  {
    "channel_id": "1850",
    "Channel_name": "Gtc News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/GTCNews_Thumbnail_906807e7-a385-488e-bf3a-28a116f6406a.png",
    "Language": "Punjabi"
  },
  {
    "channel_id": "1822",
    "Channel_name": "Ne Bharat 24",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/NEBharat24_Thumbnail_22bb6752-9977-43c1-9a05-8024e4373ea1.png",
    "Language": "Assamese"
  },
  {
    "channel_id": "1290",
    "Channel_name": "Tvri World",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TVRIW_Thumbnail-v2/TVRIW_Thumbnail.png",
    "Language": "English"
  },
  {
    "channel_id": "1363",
    "Channel_name": "Tata Play Anime Local",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/TataPlayAnimeLocal_Thumbnail_fb1845a8-b408-48d6-9d25-7d45b416a03b.jpeg",
    "Language": "Hindi"
  },
  {
    "channel_id": "1754",
    "Channel_name": "Dagdusheth Pune",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/Dagdusheth,Pune_Thumbnail_3dd6af9c-0259-4a3e-95db-cc88284dc2a9.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1338",
    "Channel_name": "Tv 45 News",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://ltsk-cdn.s3.eu-west-1.amazonaws.com/jumpstart/Temp_Live/cdn/HLS/Channel/TV45NE_Thumbnail-v1/TV45NE_Thumbnail.png",
    "Language": "Hindi"
  },
  {
    "channel_id": "1799",
    "Channel_name": "Public First",
    "Channel_logo": "https://mediaready.videoready.tv/tatasky-epg/image/fetch/f_auto,fl_lossy,q_auto,h_250,w_250/https://dvdh7g0f0hwck.cloudfront.net/assets/images/channel/PublicFirst_Thumbnail_c30cbae6-c5f0-4ac8-98f8-788261c25af4.png",
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

  extraHeaders: /extraHeaders\s*=\s*['"]?([^'"\n}]+)['"]?/

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

    const response = await axiosInstance.get(url, {

      headers: {

        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

      }

    });

    // Add delay after successful request to avoid rate limiting

    await new Promise(r => setTimeout(r, CONFIG.REQUEST_DELAY));

    return response;

  } catch (error) {

    // Retry on 429 (Too Many Requests), 503 (Service Unavailable), or network errors
    const is429 = error.response?.status === 429;

    const is503 = error.response?.status === 503;

    const isNetworkError = error.code && error.code !== 'ENOTFOUND';

    const shouldRetry = attempt < CONFIG.RETRY_ATTEMPTS && (is429 || is503 || isNetworkError);



    if (shouldRetry) {

      // Much longer backoff for 429 errors (rate limiting)

      let delay;

      if (is429) {

        delay = 2000 * Math.pow(2, attempt - 1);  // 2s, 4s, 8s, 16s, 32s

        console.warn(`⚠️  429 Rate Limited! Attempt ${attempt}/${CONFIG.RETRY_ATTEMPTS}, retrying in ${delay}ms...`);

      } else if (is503) {

        delay = 1000 * Math.pow(2, attempt - 1);  // 1s, 2s, 4s, 8s, 16s

        console.warn(`⚠️  503 Service Unavailable! Attempt ${attempt}/${CONFIG.RETRY_ATTEMPTS}, retrying in ${delay}ms...`);

      } else {

        delay = 300 * attempt;  // Regular backoff for network errors

        console.warn(`⚠️  Network error (${error.code}). Attempt ${attempt}/${CONFIG.RETRY_ATTEMPTS}, retrying in ${delay}ms...`);

      }

      

      await new Promise(r => setTimeout(r, delay));

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
