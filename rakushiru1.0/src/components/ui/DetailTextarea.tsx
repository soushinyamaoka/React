import { useState } from 'react';
import { RecipeModel } from '../../module/RecipeModel';
import { Const } from '../../module/Const';
import Service from '../../module/Service';
import "../../SpMake.css";

let service: Service = new Service();
const DetailTextarea = (props) => {
  const [value, setValue] = useState(props.modelList[props.index][RecipeModel.NAME]);
  // コンポーネント再描画問題対応
  if (props.modelList[props.index][RecipeModel.DETAIL] !== value) {
    // 現在の値と差分がある場合、再レンダリングさせる(このやり方微妙かも、、、)
    setValue(props.modelList[props.index][RecipeModel.DETAIL]);
  }
  return (
    <>
      <textarea
        ref={props.el}
        placeholder={Const.PH_DETAIL}
        className={props.className}
        value={value}
        maxLength={120}
        onChange={(e) => service.changeValue(e, props.index, props.modelList, props.setModel, RecipeModel.DETAIL)}
      ></textarea>
    </>
  );
};

export default DetailTextarea;