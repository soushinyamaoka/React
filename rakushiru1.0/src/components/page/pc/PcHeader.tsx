import { Link } from "react-router-dom";
import "../../../App.css";
import SearchInput from '../../ui/SearchInput';
import ReadLink from '../../ui/ReadLink';
import MakeLink from '../../ui/MakeLink';
import CategoryLink from '../../ui/CategoryLink';
const PcHeader = () => {
  return (
    <div id="header_app" className="header-app-root is-pcDesignUpdated" >
      <div className="inner is-pcDesignUpdated" >
        <div className="logo">
          <h1><Link to="/">Rakushiru</Link></h1>
        </div>
        <div className="headerLinks" >
          <CategoryLink
            className="DlyLink headerLink headerLink--category"
          ></CategoryLink>
          <ReadLink
            className="DlyLink headerLink headerLink--article"
          ></ReadLink>
        </div>
        <SearchInput />
        <div className="global-menu-root global-controls"  >
          <span className="button-wrapper">
            <MakeLink
              className="invite-button"
            ></MakeLink>
            {/* TODO：将来的にやりたい */}
            {/* <div dly-ghost="" className="signup-button" >
              <Link to="/test">お知らせ</Link>
            </div>
            <div dly-ghost="" className="login-button" >
              <span className="mobile-hidden" >お問い合わせ</span>
            </div> */}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PcHeader;