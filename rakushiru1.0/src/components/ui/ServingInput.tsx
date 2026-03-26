import React, { useState, useEffect, useRef } from 'react';
import { RecipeModel } from '../../module/RecipeModel';
import { Const } from '../../module/Const';
import Service from '../../module/Service';
import "../../SpMake.css";

let service: Service = new Service()
const ServingInput = (props) => {
  
  return (
    <>
      <input
        type="text"
        placeholder={Const.PH_SERVING}
        defaultValue={props.model[RecipeModel.SERVING]}
        maxLength={20}
        onChange={(e) => service.changeValue(e, 0, props.model, props.setModel, RecipeModel.SERVING)}
      ></input>
    </>
  );
};

export default ServingInput;