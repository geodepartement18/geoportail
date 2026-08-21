import Portal from "https://js.arcgis.com/4.34/@arcgis/core/portal/Portal.js";
import PortalQueryParams from "https://js.arcgis.com/4.34/@arcgis/core/portal/PortalQueryParams.js";
import FeatureLayer from "https://js.arcgis.com/4.34/@arcgis/core/layers/FeatureLayer.js";
import Map from "https://js.arcgis.com/4.34/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.34/@arcgis/core/views/MapView.js";
import { CONFIG } from "./config.js";

// Function to query for portal items.
    function queryItems(portal) {
        // Create query parameters for the portal search.
        const queryParams = new portal.queryItems({
          query: `group:${CONFIG.groupId}`,
          sortField: "num-views",
          sortOrder: "desc",
          num: 20,          
        });
        // Query the items based on the queryParams created from the portal.
        portal.queryItems(queryParams).then(createGallery);
    }

async function load() {
    var portal = new Portal({url:CONFIG.portalUrl});
    portal.authMode="anonymous";
    await portal.load();

    queryItems();
}

load();


