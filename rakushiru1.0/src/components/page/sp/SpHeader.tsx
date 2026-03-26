import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useHistory } from "react-router-dom";
import SearchInput from '../../ui/SearchInput';
import "../../../SpHome.css";

const SpHeader = () => {

  return (
    <>
      <header id="header_app" className="SpApp" >
        <div className="SpApp-inner-sub" >
        </div>
        <div className="SpApp-inner" >
          <div className="logo">
            {/* <h5>とにかく簡単レシピが満載</h5> */}
            <div style={{ paddingBottom: 5 }}>とにかく簡単レシピが満載</div>
            <h1><Link to="/">Rakushiru</Link></h1>
          </div>
          {/* TODO：将来的にやりたい */}
          {/* <div dly-ghost="" className="invite-button" >新規登録</div>
          <div dly-ghost="" className="signup-button" >ログイン</div> */}
        </div>
        <SearchInput/>
        <div className="SuggestWordsSp SpApp-searchSuggest" style={{ display: "none" }}  >
          <ul className="SuggestWordsSp-list" >
          </ul>
        </div>
      </header>
    </>
  );
}


export default SpHeader;