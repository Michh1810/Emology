import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import Consent from "./pages/Consent";
import FaceScan from "./pages/FaceScan";
import CityMap from "./pages/CityMap";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/consent",
    Component: Consent,
  },
  {
    path: "/scan",
    Component: FaceScan,
  },
  {
    path: "/city",
    Component: CityMap,
  },
]);