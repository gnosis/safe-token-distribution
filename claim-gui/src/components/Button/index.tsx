import React, { ComponentProps } from "react";
import clsx from "clsx";
import classes from "./style.module.css";

type Props = ComponentProps<"button"> & {
  primary?: boolean;
  link?: boolean;
};
const Button: React.FC<Props> = ({ className, primary, link, ...rest }) => (
  <button
    className={clsx(className, {
      [classes.default]: !primary && !link,
      [classes.primary]: primary,
      [classes.link]: link,
    })}
    {...rest}
  />
);

export default Button;
