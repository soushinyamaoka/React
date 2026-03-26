import { useHistory } from "react-router-dom";
import "../../SpMake.css";

const CancelButton = (props) => {
  const history: any = useHistory();
  const backPage = () => {
    history.push('/'); // 画面遷移
  };
  return (
    <>
      <button className="edit-Button edit-Button--contained ">
            <div className="edit-Button-body edit-Button-body--contained"
              onClick={(e) => { backPage() }}
            >キャンセル</div>
          </button>
    </>
  );
};

export default CancelButton;