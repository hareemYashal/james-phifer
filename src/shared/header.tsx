import Image from "next/image";

const Header = () => {
  return (
    <div
      style={{
        backgroundColor: "white",
        // boxShadow:
          // "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      }}
    >
      <div
        style={{
          // padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div style={{flexShrink: 0}}>
            <Image
              src="/logo1.jpg"
              alt="Phifer Consulting Logo"
              width={200}
              height={100}
              style={{objectFit: "contain"}}
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
