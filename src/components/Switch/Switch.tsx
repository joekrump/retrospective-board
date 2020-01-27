import React from "react";

interface SwitchProps {
  id: string;
}

const Switch = ({ id }: SwitchProps) => {
  return (
    <>
      <input
        className="switch--checkbox"
        id={id}
        type="checkbox"
      />
      <label
        className="switch--label"
        htmlFor={id}
      >
        <span className={`switch--button`} />
      </label>
    </>
  );
};

export { Switch };
