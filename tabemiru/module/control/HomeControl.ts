import axios from 'axios';
import config from '../../config.json';
import path from 'path'
import { KeyWord, Ingredients, Instructions } from '../model/RecipeModel';
import { Const } from '../common/Const';
import BaseControl from './BaseControl';
import HomeService from '../service/HomeService';
import { HomeJson } from '../common/JsonInterface';

export default class HomeControl extends BaseControl {

  constructor() {
		super();
	}

  public send(): Promise<HomeJson> {
    return this.sendRequest(null, null!);
  }

}