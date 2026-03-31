import { ReactNode } from "react";

interface FooterProps {
  children?: ReactNode;
}

export const Footer = ({ children }: FooterProps) => {
  return <div className="footer-fixed p-4 grid gap-4">{children}</div>;
};

export default Footer;
