import axios from 'axios';
import config from '../../config.json';
import path from 'path'
import { KeyWord, Ingredients, Instructions } from '../model/RecipeModel';
import { Const } from '../common/Const';
import AppServiceStub from '../service/AppServiceStub';
import AppService from '../service/AppService';
import AppServiceInterface from '../service/AppServiceInterface';
import { initScriptLoader } from 'next/script';

export default class BaseControl {

  protected appService!: AppServiceInterface;

  constructor() {
    this.init();
	}

  /**
  * 関数の説明
  * @param arg 引数の説明
  * @return 番号を返す
  */
  private init() {
    this.appService = Const.STUB_MODE === config.mode ? new AppServiceStub() : new AppService();
  }

  protected sendRequest(model: any, key: string): Promise<any> {
    return this.appService.send("");
  }
  
}