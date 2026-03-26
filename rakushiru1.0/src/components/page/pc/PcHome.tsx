import { useState, useEffect } from 'react';
import "../../../App.css";
import Header from './PcHeader';
import Footer from './Footer';
import SideBar from './SideBar';
import { RecipeModel, RankModels } from '../../../module/RecipeModel';
import Service from '../../../module/Service';
import RecipeLinkButton from '../../ui/RecipeLink';
import AllShowLink from '../../ui/AllShowLink';

let modelIns: RecipeModel;
let service: Service;
let isNoData: boolean = false;
let keyWord1: string = "";
let keyWord2: string = "";
let keyWord3: string = "";

const PcHome = () => {

  modelIns = new RecipeModel().getInstance();
  service = new Service();

  const [homeModel, setHomeModel] = useState(modelIns.rankModel);
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    service.reqParam.ReqCode = "openHome";
    service.reqParam.Data = service.getKeyWord();
    service.searchRecipe(service.reqParam).then(res => {
      const resData = res.data.Data;
      const rankModels: RankModels = resData.RankModels;
      keyWord1 = service.getKeyWord()[0].Word;
      keyWord2 = service.getKeyWord()[1].Word;
      keyWord3 = service.getKeyWord()[2].Word;

      if (!rankModels.Rank1) {
        isNoData = true;
        setIsInit(true);
      } else {
        // とりあえず簡易的な表示制限
        if (rankModels.Rank1 && rankModels.Rank1.length > 3) {
          rankModels.Rank1.pop();
        }
        if (rankModels.Rank2 && rankModels.Rank2.length > 3) {
          rankModels.Rank2.pop();
        }
        if (rankModels.Rank3 && rankModels.Rank3.length > 3) {
          rankModels.Rank3.pop();
        }
        isNoData = false;
        setHomeModel(rankModels);
        setIsInit(true);
      }

    })
  }, [])
  return (
    <>
      {(isInit) ? (
        <>
          <div id="main_app">
            <Header />
            <section className="partial-spa-root is-pcDesignUpdated">
              <div className="PcRoot router-view">
                <div className="PcRoot-main">
                  <div className="HeroVideoPc">
                    <div>
                      <div className="VueCarousel">
                        <div className="VueCarousel-wrapper">
                          <div className="VueCarousel-inner" style={{ transform: "translate(0px, 0px)", transition: "transform 0.5s ease 0s", flexBasis: 680, visibility: "visible", height: "auto" }}>
                            <div role="tabpanel" className="VueCarousel-slide VueCarousel-slide-active VueCarousel-slide-center">
                              <div className="DlyImg-root">
                                <img src={service.getImagePath("HomeImage.jpg")} className="DlyImg-img"></img>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="PcRoot-popularRecipes">
                    <h3 className="PcRoot-popularRecipeTitle" >人気のレシピ</h3>
                    {(isNoData) ? (
                      <h4 >レシピが見つかりませんでした</h4>
                    ) : (
                      <>
                        <div className="PcRoot-popularRecipeSectionTitle" >
                          <div className="PcRoot-popularRecipeWord" >
                            {keyWord1}
                          </div>
                          <div className="PcRoot-popularRecipeMore" >
                            <AllShowLink
                              keyWord={keyWord1}
                            ></AllShowLink>
                          </div>
                        </div>
                        <div className="PcRoot-popularRecipeItem">
                          <div>
                            <ul className="PcRoot-popularRecipeRecipes" >
                              {homeModel.Rank1.map((model) => (
                                <li key={model[RecipeModel.RECIPE_ID]} className="PcRoot-popularRecipe" >
                                  <div className="PcRoot-popularRecipe--item dly-video-item-root small"  >
                                    <a className="DlyLink thumbnail-wrapper dly-video-item-thumbnail-root small" style={{ borderRadius: 8 }}  >
                                      <div className="DlyImg-root video-list-img"  >
                                        <img src={service.getImagePath(model[RecipeModel.IMAGE])} alt={model[RecipeModel.TITLE]} dly-img-state="loaded" className="DlyImg-img" ></img>
                                      </div>
                                    </a>
                                    <div className="video-list-info" >
                                      <div className="video-list-title" >
                                        <p className="dly-video-item-title-root small"  >
                                          <RecipeLinkButton
                                            model={model}
                                          ></RecipeLinkButton>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        {(!homeModel.Rank2) ? (
                          <></>
                        ) : (
                          <>
                            <div className="PcRoot-popularRecipeSectionTitle" >
                              <div className="PcRoot-popularRecipeWord" >
                                {keyWord2}
                              </div>
                              <div className="PcRoot-popularRecipeMore" >
                                <AllShowLink
                                  keyWord={keyWord2}
                                ></AllShowLink>
                              </div>
                            </div>
                            <div className="PcRoot-popularRecipeItem">
                              <div>
                                <ul className="PcRoot-popularRecipeRecipes" >
                                  {homeModel.Rank2.map((model) => (
                                    <li key={model[RecipeModel.RECIPE_ID]} className="PcRoot-popularRecipe" >
                                      <div className="PcRoot-popularRecipe--item dly-video-item-root small"  >
                                        <a className="DlyLink thumbnail-wrapper dly-video-item-thumbnail-root small" style={{ borderRadius: 8 }}  >
                                          <div className="DlyImg-root video-list-img"  >
                                            <img src={service.getImagePath(model[RecipeModel.IMAGE])} alt={model[RecipeModel.TITLE]} dly-img-state="loaded" className="DlyImg-img" ></img>
                                          </div>
                                        </a>
                                        <div className="video-list-info" >
                                          <div className="video-list-title" >
                                            <p className="dly-video-item-title-root small"  >
                                              <RecipeLinkButton
                                                model={model}
                                              ></RecipeLinkButton>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </>
                        )}
                        {(!homeModel.Rank3) ? (
                          <></>
                        ) : (
                          <>
                            <div className="PcRoot-popularRecipeSectionTitle" >
                              <div className="PcRoot-popularRecipeWord" >
                                {keyWord3}
                              </div>
                              <div className="PcRoot-popularRecipeMore" >
                                <AllShowLink
                                  keyWord={keyWord3}
                                ></AllShowLink>
                              </div>
                            </div>
                            <div className="PcRoot-popularRecipeItem">
                              <div>
                                <ul className="PcRoot-popularRecipeRecipes" >
                                  {homeModel.Rank3.map((model) => (
                                    <li key={model[RecipeModel.RECIPE_ID]} className="PcRoot-popularRecipe" >
                                      <div className="PcRoot-popularRecipe--item dly-video-item-root small"  >
                                        <a className="DlyLink thumbnail-wrapper dly-video-item-thumbnail-root small" style={{ borderRadius: 8 }}  >
                                          <div className="DlyImg-root video-list-img"  >
                                            <img src={service.getImagePath(model[RecipeModel.IMAGE])} alt={model[RecipeModel.TITLE]} dly-img-state="loaded" className="DlyImg-img" ></img>
                                          </div>
                                        </a>
                                        <div className="video-list-info" >
                                          <div className="video-list-title" >
                                            <p className="dly-video-item-title-root small"  >
                                              <RecipeLinkButton
                                                model={model}
                                              ></RecipeLinkButton>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div >
                </div >
                <SideBar />
              </div>
            </section>
            {/* <Footer /> */}
          </div>
        </>
      ) : (
        <></>// showFlagがfalseの場合はModalは表示しない
      )}
    </>
  );
}

export default PcHome;