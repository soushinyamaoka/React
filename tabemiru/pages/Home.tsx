import React, { useState, useEffect } from 'react'
import App, { AppProps } from 'next/app'
import Image from 'next/image';
import Header from '../components/ui/Header';
import HomeControl from '../module/control/HomeControl';
import { HomeJson, HomeJsonInit, RecipeInfo, Videos } from '../module/common/JsonInterface';

const Home = () => {
  const [data, setData] = useState(new HomeJsonInit().getIniHomeJson());
  const [isInit, setIsInit] = useState(false);
  useEffect(() => {
    // 即時関数
    (async () => {
      try {
        const homeControl: HomeControl = new HomeControl();
        setData(await homeControl.send());
      } catch (err) {
        // setError(true);
      } finally {
        setIsInit(true)
      }
    })()
  }, [])
  return (
    <>
      {(isInit) ? (
        <>
          <Header/>
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
                {data!.recipeInfo.map((info: RecipeInfo) => (
                  <section key={info.title} className="section-main">
                    <h3>{info.title}</h3>
                    <div className="section-secondary">
                      {info.videos.map((video: Videos) => (
                        <div key={video.title} className="section-left">
                          <div className="iframe-wrapper">
                            <iframe src={"https://www.youtube.com/embed/" + video.id} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" ></iframe>
                          </div>
                          <span>{video.title}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

              </main>
              <div className="col2">２列目</div>
            </article>
          </div>
          <footer>
            <div className="footer-main">
              フッタ
            </div></footer>
        </>
      ) : (
        <></>// showFlagがfalseの場合はModalは表示しない
      )}
    </>
  );
}

export default Home;