import React from "react";
import AllShowLink from '../../ui/AllShowLink';
import KeyWordLink from '../../ui/KeyWordLink';

const SideBar = () => {
  return (
    <div className="PcAside">
      <div className="PcAside-ads">
        <div className="PcAside-adsInner">
          <script data-ad-client="ca-pub-4026294411988033" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
        </div>
      </div>
      {/* <a href="https://chirashiru.kurashiru.com/" target="_blank" rel="noopener" className="PcAside-bannerLink PcAside-bannerLink--kurashiruChirashi" >
        <div className="DlyImg-root PcAside-kurashiruChirashiLinkImage" >
          <img src="//assets.kurashiru.com/production/assets/kurashiru_chirashi_banner-b96fbfddf1aec3c24e0abc3cb335e67bca04f7fb94d0f11d52e7599adfd53d0d.jpg" dly-img-state="loaded" className="DlyImg-img" ></img>
          <div className="DlyImg-placeholder" style={{ paddingBottom: "21.282798833819243%" }} >
            <noscript>
              <img className="DlyImg-noscriptImg" src="//assets.kurashiru.com/production/assets/kurashiru_chirashi_banner-b96fbfddf1aec3c24e0abc3cb335e67bca04f7fb94d0f11d52e7599adfd53d0d.jpg" alt=""></img>
            </noscript>
          </div>
        </div>
      </a> */}
      <div className="PcAside-keywords" >
        <h2 className="PcAside-sectionTitle" >
          定番のキーワード
        </h2>
        <div className="PcAside-keywordList" >
          <KeyWordLink
            className="DlyLink PcAside-keywordListItem"
            keyWord={"ラーメン"}
          ></KeyWordLink>
          <KeyWordLink
            className="DlyLink PcAside-keywordListItem"
            keyWord={"つまみ"}
          ></KeyWordLink>

        </div>
      </div>
      <div className="PcAside-keywords" >
        <h2 className="PcAside-sectionTitle" >
          <div className="PcAside-sectionTitleBody" >
            その他のキーワード
          </div>
          {/* <a href="https://www.kurashiru.com/tags" className="PcAside-sectionTitle--more" >
            すべて見る
          </a> */}
        </h2>
        <div className="PcAside-keywordList" >
          <KeyWordLink
            className="DlyLink PcAside-keywordListItem"
            keyWord={"ラーメン"}
          ></KeyWordLink>
          <KeyWordLink
            className="DlyLink PcAside-keywordListItem"
            keyWord={"つまみ"}
          ></KeyWordLink>
        </div>
      </div>
      <div className="PcAside-stickyContainer" >
        <div className="PcAside-ads" ><div className="PcAside-adsInner" style={{ transformOrigin: "left top", margin: "0px 0px 24px", transform: "scaleY(1) scaleX(1)" }}>
          <div id="div-gpt-ad-1564119663506-0" className="dlyAds ads-fluct-root aside-ads" data-v-cac48460="" style={{ margin: "0 !important" }} data-transform-id="cffc67b0-2a80-4301-8993-706f66583363" data-google-query-id="CPmK-9WLqvICFVU0KgodsAECyA">
            <div id="google_ads_iframe_/67340404/p_kurashiru_300*250_top_migicolumn_keywordshita_0__container__" style={{ border: "0pt none", display: "inline-block", width: 300, height: 250 }}>
              <iframe src="https://dfff41baa3e3d5f3427f6b5a3d3d8961.safeframe.googlesyndication.com/safeframe/1-0-38/html/container.html" id="google_ads_iframe_/67340404/p_kurashiru_300*250_top_migicolumn_keywordshita_0" title="3rd party ad content" name="" scrolling="no" style={{ width: "300", height: "250", border: 0, verticalAlign: "bottom" }} data-is-safeframe="true" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation" allow="attribution-reporting" data-google-container-id="3" data-load-complete="true"></iframe>
            </div>
          </div>
        </div>
        </div>
        <div className="PcAside-ads" >
          <div className="PcAside-adsInner" style={{ transformOrigin: "left top", margin: "0px 0px 24px", transform: "scaleY(0.892857) scaleX(0.892857)" }}>
            <div id="div-gpt-ad-1564120115510-0" className="dlyAds ads-fluct-root aside-ads" data-v-cac48460="" style={{ margin: "0 !important" }} data-transform-id="324d077c-040a-4d2b-8226-920754a7dc9e" data-google-query-id="CPqK-9WLqvICFVU0KgodsAECyA">
              <div id="google_ads_iframe_/67340404/p_kurashiru_300*600_top_halfpage_migicolumn_bottom_0__container__" style={{ border: "0pt none" }}>
                <iframe id="google_ads_iframe_/67340404/p_kurashiru_300*600_top_halfpage_migicolumn_bottom_0" title="3rd party ad content" name="google_ads_iframe_/67340404/p_kurashiru_300*600_top_halfpage_migicolumn_bottom_0" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation" allow="attribution-reporting" style={{ border: 0, verticalAlign: "bottom", width: 336, height: 280 }} data-google-container-id="4" data-load-complete="true">
                </iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SideBar;