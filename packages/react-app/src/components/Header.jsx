import React from "react";
import { PageHeader } from "antd";

// displays a page header

export default function Header() {
  return (
    <a href="https://github.com/austintgriffith/scaffold-eth" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="Hackathon Muñon 3.0"
        subTitle="decentralized and transparent hackathon on top of ethereum"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
