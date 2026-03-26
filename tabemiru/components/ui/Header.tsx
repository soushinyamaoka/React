
const Header = () => {
  return (
    <header>
      <div className="header-main">
        <h1 className="brand">Tabemiru</h1>
        <nav className="nav">
          <button className="nav__toggle" aria-expanded="false" type="button">
            menu
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;