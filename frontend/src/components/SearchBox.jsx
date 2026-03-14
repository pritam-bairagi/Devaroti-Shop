import React, { useState, useRef, useEffect } from "react";
import { ScanSearch, Camera, ImageUp } from "lucide-react";

const ShowOptions = () => {
  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef(null);

  const handleClick = () => {
    setShowOptions(!showOptions);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={menuRef} className="absolute right-2.5 top-2">
      <button onClick={handleClick}
        className=""
      >
        <ScanSearch size={24}/>
      </button>

      {showOptions && (
        <div className="flex flex-col gap-3 mt-2">
          <button>
            <Camera />
          </button>

          <button>
            <ImageUp />
          </button>
        </div>
      )}
    </div>
  );
};

export default ShowOptions;