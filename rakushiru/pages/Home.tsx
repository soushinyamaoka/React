import React from "react";
import App, { AppProps } from 'next/app'
import Image from 'next/image';
import PcHome from './pc/PcHome';
import SpHome from './sp/Home';

const Home = () => {
  return (
    <div>
      <header>
        <div className="header-main">
          ヘッダー
        </div>
      </header>
      <nav className="nav-main">
        <ul className="nav-list">
          <li></li>
          <li>人気</li>
          <li>カテゴリ</li>
          <li>季節</li>
          <li></li>
        </ul>
      </nav>
      <div className="twocols">
        <article className="twocols-container w-container">
          <main className="col1">
            <section className="top-pickup-main">
              <h3>ピックアップ動画</h3>
              <div className="top-pickup-secondary">
                <div className="top-pickup-left">
                  <div className="iframe-wrapper">
                    <iframe src="https://www.youtube.com/embed/Vvm7eHsTMp8" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" ></iframe>
                  </div>
                </div>
                <div className="top-pickup-right">
                  <span>【糖質制限レシピ】コスパ最強！低糖質・高タンパク！「鶏むね肉と白菜のトマト煮」の作り方</span>
                </div>
              </div>
            </section>
            <section className="section-main">
              <h3>人気レシピ</h3>
              <div className="section-secondary">
                <div className="section-left">
                  <div className="iframe-wrapper">
                    <iframe src="https://www.youtube.com/embed/Vvm7eHsTMp8" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" ></iframe>
                  </div>
                  <span>【糖質制限レシピ】コスパ最強！低糖質・高タンパク！「鶏むね肉と白菜のトマト煮」の作り方</span>
                </div>
                <div className="section-left">
                  <div className="iframe-wrapper">
                    <iframe src="https://www.youtube.com/embed/Vvm7eHsTMp8" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" ></iframe>
                  </div>
                  <span>【糖質制限レシピ】コスパ最強！低糖質・高タンパク！「鶏むね肉と白菜のトマト煮」の作り方</span>
                </div>
                <div className="section-left">
                  <div className="iframe-wrapper">
                    <iframe src="https://www.youtube.com/embed/Vvm7eHsTMp8" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" ></iframe>
                  </div>
                  <span>【糖質制限レシピ】コスパ最強！低糖質・高タンパク！「鶏むね肉と白菜のトマト煮」の作り方</span>
                </div>
              </div>
            </section>
          </main>
          <div className="col2">２列目</div>
        </article>
      </div>
      <footer>
        <div className="footer-main">
          フッタ
        </div></footer>
    </div>
  );
}

export default Home;