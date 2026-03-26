import Service from '../../module/Service';
import "../../SpMake.css";

let service: Service = new Service();
const DeleteButton = (props) => {
  return (
    <>
      <button
        className="delete"
        onClick={() => service.delRow(props.index, props.modelList, props.setModel)}
      >削除</button>
    </>
  );
};

export default DeleteButton;