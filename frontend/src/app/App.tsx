import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CatalogLoader from "@/components/schedule/CatalogLoader";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <CatalogLoader />
      <Navbar />
      <Outlet /> 
      <Footer />
    </div>
  );
}
