import React from "react";
import { PageHeader } from "antd";

// displays a page header

export default function Header() {
  return (
    <a href="/" rel="noopener noreferrer">
      <PageHeader
        title="Hackathon Muñon 3.0"
        subTitle="decentralized hackathon on ethereum"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
