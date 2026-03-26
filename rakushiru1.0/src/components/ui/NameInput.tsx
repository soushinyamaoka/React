import { useState } from 'react';
import { RecipeModel } from '../../module/RecipeModel';
import { Const } from '../../module/Const';
import Service from '../../module/Service';
import "../../SpMake.css";

let service: Service = new Service()
const NameInput = (props) => {
  const [value, setValue] = useState(props.modelList[props.index][RecipeModel.NAME]);
  // コンポーネント再描画問題対応
  if (props.modelList[props.index][RecipeModel.NAME] !== value) {
    // 現在の値と差分がある場合、再レンダリングさせる(このやり方微妙かも、、、)
    setValue(props.modelList[props.index][RecipeModel.NAME])
  }

  return (
    <>
      <input
        ref={props.el}
        className={props.className}
        placeholder={Const.PH_NAME}
        value={value}
        maxLength={40}
        onChange={(e) => service.changeValue(e, props.index, props.modelList, props.setModel, RecipeModel.NAME)}
      >
      </input>
    </>
  );
};

export default NameInput;