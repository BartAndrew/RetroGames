import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests',testMatch:'**/*.spec.mjs',fullyParallel:false,retries:0,workers:1,timeout:30000,expect:{timeout:7000},use:{baseURL:process.env.SF_BASE_URL||'http://127.0.0.1:4173/StereoTypeFighter/',browserName:'chromium',trace:'retain-on-failure'},reporter:[['line'],['html',{outputFolder:'playwright-report',open:'never'}]],outputDir:'test-results',webServer:process.env.SF_NO_WEBSERVER?undefined:{command:'python3 -m http.server 4173 -d ../_site',url:'http://127.0.0.1:4173/StereoTypeFighter/',reuseExistingServer:true,timeout:15000}
});
