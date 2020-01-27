import React, { ChangeEvent } from "react";
import "./switch.css";

interface SwitchProps {
  id: string;
  handleChange: (e: ChangeEvent) => void;
  isOn: boolean;
}

const Switch = ({ id, handleChange, isOn }: SwitchProps) => {
  return (
    <>
      <input
        className="switch--checkbox"
        id={id}
        checked={isOn}
        type="checkbox"
        onChange={handleChange}
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
