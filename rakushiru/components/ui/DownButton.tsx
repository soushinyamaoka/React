import Service from '../../module/Service';
import "styles/SpMake.css";

let service: Service = new Service();
const DownButton = (props:any) => {
  return (
    <>
      <button
        className="down-button"
        onClick={() => service.downRow(props.index, props.modelList, props.setModel)}
      >↓</button>
    </>
  );
};

export default DownButton;