import PropTypes from "prop-types";

function Footer({ children }) {
  return (
    <div className="footer-fixed">
      <div>{children}</div>
    </div>
  );
}

Footer.propTypes = {
  children: PropTypes.node,
};

export default Footer;
