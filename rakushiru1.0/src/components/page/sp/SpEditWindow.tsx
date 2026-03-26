import "../../SpMake.css";
import React from 'react';



const SpEditWindowTemp = () => {
  return (
    <>
      <div id="modal_window">
        <div id="recipe_update_form">
          <div className="inner">
            <form id="edit_recipe_step_form" className="recipe_update_form" data-update_element_id="step_memo_32900740" data-type="html" action="/step/update/32900740" accept-charset="UTF-8" data-remote="true" method="post">
              <input name="utf8" type="hidden" value="✓"></input>
              <input type="hidden" name="_method" value="patch"></input>
              <input type="hidden" name="authenticity_token" value="WhNsimuBBxjLffz6Yp0BohLLn6KVR6RNNDPBIzxNWa6Tk1kBQonXLXVqXqXyWP5nxRR9fjSojqpOeNzrq1pnYQ=="></input>
              <div className="navi">
                <div className="cancel">
                  <a className="edit_button dismiss_modal_window button action min" href="">キャンセル</a>
                </div>
                <div className="edit_item_name">
                  作り方2
                </div>
                <div className="save_and_lenth_check">
                  <div id="counter" style={{ color: "rgb(153, 153, 153)" }}>60</div>
                  <input type="submit" name="commit" value="保存" className="save_button button attention min"></input>
                </div>
              </div>
              <textarea data-counter_id="counter" data-limit="60" placeholder="作り方を入力してください" data-submit_className="save_button" className="disable_invalid_character" name="step[memo]" id="step_memo"></textarea>
            </form></div>
        </div>
      </div>
    </>
  );
}

class SpEditWindow extends React.Component {

  render() {
    return SpEditWindowTemp()
  }
}

export default SpEditWindow;