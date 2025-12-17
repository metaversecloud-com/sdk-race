import PropTypes from "prop-types";

export const Footer = ({ children }) => {
  return <div className="footer-fixed p-4 grid gap-4">{children}</div>;
};

Footer.propTypes = {
  children: PropTypes.node,
};

export default Footer;
