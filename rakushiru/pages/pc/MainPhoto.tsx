import "../../Make.css";

const MainPhoto = () => {
  return (
    <div>
      <div className="image-select">
        <div>
          <input name="image" type="radio" ></input>
          <label>画像</label>
        </div>
        <div>
          <input name="image" type="radio" ></input>
          <label>YouTube</label>
        </div>
      </div>
      <div className="clickable_image_uploader_wrapper" data-blank-image="https://assets.cpcdn.com/assets/themes/recipe/blank.png?83b7514a3fee402c0ec13b51dee90d18adbbfd1a79b556bf060fe7735791bc2f" id="recipe_photo_wrapper">
        <form id="recipe_image_form" className="uploader_form" action="/recipe/6908930/image_upload" accept-charset="UTF-8" method="post">
          <input name="utf8" type="hidden" value="✓"></input>
          <input type="hidden" name="authenticity_token" value="DQsaAGOTBwc9yX1QkhvFT07ADcAm240q+BMXHp7E9tPEiy+LSpvXMoPe3w8C3jqKmR/vHIc0p82CWArWCdPIHA=="></input>
          <img alt="クリックして写真をのせる" id="recipe-photo" className="uploader" src={`${process.env.PUBLIC_URL}/input.png`}></img>
        </form>
      </div>
    </div>
  );
}

export default MainPhoto;