import React, { Component } from "react";
import PcHome from './components/page/pc/PcHome';
import SpHome from './components/page/sp/Home';
import SpRecipesInfo from './components/page/sp/SpRecipesInfo';
import PcMakeRecipes from './components/page/pc/PcMakeRecipes';
import SpMakeRecipes from './components/page/sp/SpMakeRecipes';
import PcRecipesInfo from './components/page/pc/PcRecipesInfo';
import SpRecipeList from './components/page/sp/SpRecipeList';
import PcRecipeList from './components/page/pc/PcRecipeList';
import { BrowserRouter, Redirect, Route, Switch, useLocation } from "react-router-dom";

interface Props { }

interface State {
  message: string;
}

const App = (props) => {


  const getHome = () => {
    if (window.innerWidth > 767) {
      return PcHome
    } else {
      return SpHome
    }
  }
  const getHowToMake = () => {
    if (window.innerWidth > 767) {
      return PcRecipesInfo
    } else {
      return SpRecipesInfo
    }
  }

  const getMakeRecipes = () => {
    if (window.innerWidth > 767) {
      return PcMakeRecipes
    }
    return SpMakeRecipes
  }

  const getMakeRecipeList = () => {
    if (window.innerWidth > 767) {
      return PcRecipeList
    }
    return SpRecipeList
  }

  // 404対策(ちょっと微妙な気が、、、)
  const NotFound = () => {
    const pathName:string = window.location.pathname
    let path = pathName.split('/');
    if (path.length > 2 && path[1] === "RecipeList") {
      // セッションにキーを保存
      sessionStorage.setItem('keyWord', path[1]);
      if (window.innerWidth > 767) {
        return PcRecipeList
      }
      return SpRecipeList
    } else if (path.length > 2 && path[1] === "RecipesInfo") {
      // セッションにキーを保存
      sessionStorage.setItem('recipeId', path[1]);
      if (window.innerWidth > 767) {
        return PcRecipesInfo
      }
      return SpRecipesInfo
    }

    if (window.innerWidth > 767) {
      return PcHome
    } else {
      return SpHome
    }
  }
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={getHome()} />
        <Route path="/MakeRecipes/:id" exact component={getMakeRecipes()} />
        <Route path="/RecipesInfo/:id" exact component={getHowToMake()} />
        <Route path="/RecipeList/:key" exact component={getMakeRecipeList()} />
        <Route path="/RecipeList/" exact component={getMakeRecipeList()} />
        <Route path="/dummyForm/" exact component={getMakeRecipeList()} />
        <Redirect to="/" />
        <Route component={NotFound()} />
      </Switch>
    </BrowserRouter>
  );
};
export default App;