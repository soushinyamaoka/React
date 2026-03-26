import { useState } from 'react';
import { RecipeModel } from '../../module/RecipeModel';
import { Const } from '../../module/Const';
import Service from '../../module/Service';
import "../../SpMake.css";

let service: Service = new Service();
const QuantityInput = (props) => {
  const [value, setValue] = useState(props.modelList[props.index][RecipeModel.NAME]);
  // コンポーネント再描画問題対応
  if (props.modelList[props.index][RecipeModel.QUANTITY] !== value) {
    // 現在の値と差分がある場合、再レンダリングさせる(このやり方微妙かも、、、)
    setValue(props.modelList[props.index][RecipeModel.QUANTITY])
  }
  return (
    <>
      <input
        className={props.className}
        placeholder={Const.PH_QUANTITY}
        value={value}
        maxLength={20}
        onChange={(e) => service.changeValue(e, props.index, props.modelList, props.setModel, RecipeModel.QUANTITY)}
      ></input>
    </>
  );
};

export default QuantityInput;