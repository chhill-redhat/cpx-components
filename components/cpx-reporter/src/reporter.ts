function CombineEventData(payload, target, data) {
  let combination = Object.assign(payload(target), data ?? {});
  return combination;
}

const eventMap = new Map([
  ['Page Load Started', {
    payload:'page',
    data: {
      page: (tgt:EventTarget, data?) => {
        return Object.assign({
          "analyticsTitle": "<analyticsTitle>", // Analytics Title field in Drupal
          "blogAuthor": "<blogAuthor>", // captures author of blog articles
          "contentID": "<contentID>", // 545121
          "contentType": "<contentType>", // E-book
          "dataObject":"<dataObject>", //appEventData,digitalData,DOM
          "destinationURL": "<destinationURL>", // https://www.redhat.com/en/home-page
          "errorType": "<errorType>", // 404
          "gated": "<gated>", // true
          "pageCategory": "<pageCategory>", // technologies
          // Build pageName to match format:
          // [siteName]|[primary Category]|[subcategory1]|[subcategory2]|[subcategory3]|[subcategory4]|[page detail name]
          pageName: data ? [data['siteName'],data['pageCategory'], data['subsection'], data['subsection2'], data['subsection3'], data['lastUrlItem']].filter(v=>(typeof v !== 'undefined' && v !== null)).join('|'): '',
          "siteName": "<siteName>",
          "pageTitle": "<pageTitle>", //Red Hat Enterprise Linux operating system
          "pageType": "<pageType>", // pattern_template
          "pageSubType": "<pageSubType>", // Product
          "pageStatus": "<pageStatus>",
          previousPage: ((r) => { 
            if (r) {
              let a = document.createElement("a");
              a.href = r;
              return a.href;
            }
          })(document.referrer),
          queryParameters: ((url) => Object.fromEntries(url.searchParams))(new URL(window.location.href)),
          siteExperience: ((w)=> (w > 992) ? 'desktop' : ((w > 768) ? 'tablet' : 'mobile'))(window.innerWidth),
          "siteLanguage": "<siteLanguage>",
          "subsection": "<subsection>", // linux-platforms
          "subsection2": "<subsection2>", // enterprise-linux2
          "subsection3": "<subsection3>" // try-it
          // "taxonomyMetaHreflang": [""],
          // "taxonomyRegion": [""],
          // "taxonomyBlogPostCategory": [""],
          // "taxonomyBusinessChallenge":[""],
          // "taxonomyProduct":[""],
          // "taxonomyProductLine":[""],
          // "taxonomySolution":[""],
          // "taxonomyTopic":[""],
          // "taxonomyAuthor":[""],
          // "taxonomyStage":[""],
        },data)
      }
    }
  }],
  ['Page Load Completed', {}],
  ['User Signed In', {payload:'user',data:{user:(tgt:EventTarget, data?) => {return {"custKey": "{custKey}"}}}}],
  ['User Detected', {payload:'user',data:{
    user:(tgt:EventTarget, data?) => {
        return Object.assign({
          "custKey": "",
          "accountID": "", 
          "accountIDType": "",
          "userID": "",
          "lastLoginDate": "",
          "loggedIn": "false",
          // "registered":"true",
          "socialAccountsLinked":"",
          "subscriptionFrequency": "",
          "subscriptionLevel": "",
          "hashedEmail": ""
          },data)
        }
      }
    }
  ],
  ['Content Listing Displayed',{payload:'listingDisplayed',data:{listingDisplayed:(tgt:EventTarget, data?) => {return {"displayCount": "<displayCount>","listingDriver": "<listingDriver>", "filterList": "<filterList>","resultsCount": "<resultsCount>"}}}}],
  ['Content Listing Item Clicked', {payload:'listingClicked',data:{listingClicked:(tgt:EventTarget, data?) => {return {"displayPosition": "<displayPosition>", "linkType": "<linkType>", "contentTitle": "<contentTitle>"}}}}],
  ['Form Viewed', {payload:'form',data:{form:(tgt:EventTarget, data?) => {return {}}}}],
  ['Form Submission Succeeded', {payload:'form',data:{form:(tgt:EventTarget, data?) => {return {}}}}],
  ['Form Submission Failed', {payload:'form',data:{form:(tgt:EventTarget, data?) => {return {}}}}],
  ['Error Message Presented', {payload:'error',data:{error: (tgt:EventTarget, data?) => {return {errorCode:'',errorType:''}}}}]
]);

/**
 * Event Types: Page, User, Content, Search, Campaign, Video, CTA, Download, Form
 * Event Payloads: page, user, listingDisplayed, listingClicked, onsiteSearch, internalCampaign, video, linkInfo, form
 * <a href="https://gitlab.cee.redhat.com/chhill/red_hat_analytics/-/blob/main/libraries/src/js/red_hat_analytics_eddl_top.es6.js">ADDITIONAL PAGE OBJECT DATA</a> 
 * 
 * @summary ReporterEvent class for use with the cpx-reporter element or standalone
 * @fires {CustomEvent} cpx-report - customizable through the emitName parameter
 */
export class ReporterEvent extends Event {
    constructor(name, data?, emitName='cpx-report') {
        super(emitName, { bubbles:true, composed:true });
        this.name = name;
        this.obj = eventMap.get(name);
        if (this.obj && this.obj.payload && this.obj.data) {
          const objEntries = new Map([[
            this.obj.payload,
            this.obj.data[this.obj.payload](this.currentTarget, data ?? {})
          ]]);
          this.data = Object.fromEntries(objEntries);
        }
    }
    obj:any;
    data?:any;
    name:string;
    toJSON = () => Object.assign({ event: this.name },this.data);
}

/* OLD BROWSER COMPATIBLE 
const scripts = document.getElementsByTagName('script');
const reporter = scripts[scripts.length-1];
*/
const reporter = document.querySelector(`script[src*='${(new URL(import.meta.url)).pathname}']:not([reported])`);
if (reporter instanceof HTMLElement) {
  if (reporter.getAttribute('reported') == null) {
    const data = JSON.parse(reporter.textContent ?? '');
    const emitName = reporter.getAttribute('data-emit') ?? 'cpx-report';
    globalThis.dispatchEvent(new ReporterEvent(reporter.dataset.event, data, emitName));
    reporter.setAttribute('reported','');
  } 
}

   
  /*

  Event Types: 
      Page, User, Content, 
      Search, Campaign, Video,
      CTA, Download, Form

  Page Load Completed
    'event': 'Page Load Completed'

  
  Page Load Started
    'event': 'Page Load Started',
  "page": {
      "pageCategory": "<pageCategory>", // technologies
      "pageName": "<pageName>", //siteName|primary Category|subcategory1|subcategory2|subcategory3|subcategory4|page detail name
      "siteName": "<siteName>",
      "pageTitle": "<pageTitle>", //Red Hat Enterprise Linux operating system
      "pageType": "<pageType>", // pattern_template
      "pageSubType": "<pageSubType>", // Product
      "pageStatus": "<pageStatus>",
      "siteExperience": "<siteExperience>", // mobile
      "siteLanguage": "<siteLanguage>",
      "subsection": "<subsection>", // linux-platforms
      "subsection2": "<subsection2>", // enterprise-linux2
      "subsection3": "<subsection3>", // try-it
      "cms": "<cms>", // RH CMS 2020.14.0
      "analyticsTitle": "<analyticsTitle>", // Analytics Title field in Drupal
      "blogAuthor": "<blogAuthor>", // captures author of blog articles
      "contentID": "<contentID>", // 545121
      "contentType": "<contentType>", // E-book
      "destinationURL": "<destinationURL>", // https://www.redhat.com/en/home-page
      "errorType": "<errorType>", // 404
      "gated": "<gated>", // true
      "taxonomyMetaHreflang": ["29051"],
      "taxonomyRegion": ["4521"],
      "taxonomyBlogPostCategory": ["4261"],
      "taxonomyBusinessChallenge":["161"],
      "taxonomyProduct":["781"],
      "taxonomyProductLine":["831"],
      "taxonomySolution":["1071"],
      "taxonomyTopic":["9011", "27061"],
      "taxonomyAuthor":["1111"],
      "taxonomyStage":["111"],
      "dataObject":"<dataObject>" //appEventData,digitalData,DOM
      }


  User Signed In
  "event": "User Signed In",
  "user": {
      "custKey": "<custKey>"
  }

  User Detected
    'event': 'User Detected',
  "user": {
      "custKey": "<custKey>",
      "accountID": "<accountID>", //Customer Portal
      "accountIDType": "External",
      "userID": "<userID>",
      "lastLoginDate": "",
      "loggedIn": "false",
      "registered":"true",
      "socialAccountsLinked":"",
      "subscriptionFrequency": "",
      "subscriptionLevel": "",
      "hashedEmail": ""
  }


  Content Listing Displayed
    'event': 'Content Listing Displayed',
  "listingDisplayed": {
      "displayCount": "<displayCount>",
      "listingDriver": "<listingDriver>", 
      "filterList": "<filterList>",
      "resultsCount": "<resultsCount>"
  }

  Content Listing Item Clicked
  'event': 'Content Listing Item Clicked',
  "listingClicked": {
          "displayPosition": "<displayPosition>", 
  "linkType": "<linkType>", 
  "contentTitle": "<contentTitle>"
              }


  Onsite Search Performed
    "event": "Onsite Search Performed",
"onsiteSearch": {
  "keyword": {
    "searchType": "global_search",
    "searchTerm": "<searchTerm>",
    “searchMethod”: “<searchMethod>”
  }
}

  Internal Campaign Clicked
    'event': 'Internal Campaign Clicked',
  "internalCampaign": {
      "campaignList": [
          {
              "internalCampaignCreative": "<internalCampaignCreative>",
              "internalCampaignID": "<internalCampaignID>",
              "internalCampaignName": "<internalCampaignName>",
              "internalCampaignObjective": "<internalCampaignObjective>",
              "internalCampaignPosition": "<internalCampaignPosition>"
          }
      ],
      "internalCampaignID": "<internalCampaignID>"
  }

  Internal Campaign Displayed
    'event': 'Internal Campaigns Displayed',
  "internalCampaign": {
      "campaignList": [
          {
              "internalCampaignCreative": "<internalCampaignCreative>",
              "internalCampaignID": "<internalCampaignID>",
              "internalCampaignName": "<internalCampaignName>",
              "internalCampaignObjective": "<internalCampaignObjective>",
              "internalCampaignPosition": "<internalCampaignPosition>"
          }
      ]
  }

  Video Started
    "event": "Video Started",
"video": {
  "videoID": "<videoID>",
  "videoName": "<videoName>",
  "secondsLength": "<secondsLength>",
  "videoPlayerType": "<videoPlayerType>",
  "categoryName": "<categoryName>"
}


Video Milestone Reached
"event": "Video Milestone Reached",
"video": {
  "milestone": "<milestone>",
  "videoID": "<videoID>",
  "videoName": "<videoName>",
  "secondsLength": "<secondsLength>",
  "videoPlayerType": "<videoPlayerType>",
  "categoryName": "<categoryName>"
}

Video Completed
  "event": "Video Completed",
"video": {
  "categoryName": "<categoryName>",
  "videoPlayerType": "<videoPlayerType>",
  "secondsLength": "<secondsLength>",
  "videoName": "<videoName>",
  "videoID": "<videoID>"
}



  CTA Link Clicked
  "event": "CTA Link Clicked",
"linkInfo": {
  "linkId": "<linkId>",
  "linkContainer": "<linkContainer>",
  "linkRegion": "<linkRegion>"
}

  Download Complete
  "event": "Download Complete",
"linkInfo": {
  "linkId": "<linkId>",
  "linkContainer": "<linkContainer>",
  "linkRegion": "<linkRegion>",
  "fileName": "<fileName>",
  "fileType": "<fileType>"
}



  Form Viewed
    'event': 'Form Viewed',
  "form": {
      "formField": [
          {
              "fieldID": "<fieldID>",
              "fieldPosition": "<fieldPosition>"
          }
      ],
      "formID": "<formID>",
      "formName": "<formName>",
      "formType": "<formType>",
      "formTemplate": "<formTemplate>",
      "offerID": "<offerID>",
      "formField": [
        {
          "fieldID": "<fieldID>",
          "fieldPosition": "<fieldPosition>"
        }
      ]
  }


  Form Submission Success
    'event': 'Form Submission Succeeded',
  "form": {
      "formID": "<formID>",
      "formName": "<formName>",
      "formType": "<formType>",
      "formTemplate": "<formTemplate>",
      "offerID": "<offerID>"
  }


  Form Submission Failed    
    'event': 'Form Submission Failed',
  "form": {
      "formError": "<formError>",
      "formField": [
          {
              "fieldID": "<fieldID>",
              "fieldPosition": "<fieldPosition>",
              "formFieldError": "<formFieldError>"
          }
      ],
      "formName": "<formName>",
      "formTemplate": "<formTemplate>",
      "offerID": "<offerID>",
      "formType": "<formType>"
  }

*/