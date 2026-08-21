import Portal from "https://js.arcgis.com/4.34/@arcgis/core/portal/Portal.js";
import PortalQueryParams from "https://js.arcgis.com/4.34/@arcgis/core/portal/PortalQueryParams.js";
import FeatureLayer from "https://js.arcgis.com/4.34/@arcgis/core/layers/FeatureLayer.js";
import Map from "https://js.arcgis.com/4.34/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.34/@arcgis/core/views/MapView.js";
import { CONFIG } from "./config.js";

// Function to query for portal items.
function listItems(portal) {
        // Create query parameters for the portal search.
        const queryParams = new PortalQueryParams({
          query: `group:${CONFIG.groupId}`,
          sortField: "num-views",
          sortOrder: "desc",
          num: 20,          
        });
        // Query the items based on the queryParams created from the portal.
        portal.queryItems(queryParams).then(createGallery);
}

// Function to build the UI for the gallery to display queried portal items.
      function createGallery(items) {
        items.results.forEach((item) => {
          // Create a card for each item and add a thumbnail, title, subtitle,
          // view count value, and a button to open the item in a new window.
          const card = document.createElement("calcite-card");
          const thumbnail = document.createElement("img");
          thumbnail.slot = "thumbnail";
          thumbnail.src = item.thumbnailUrl;

          const title = document.createElement("span");
          title.slot = "heading";
          title.style = "overflow: hidden; white-space: nowrap; text-overflow: ellipsis;";
          title.textContent = item.title;

          const type = document.createElement("span");
          type.slot = "description";
          type.textContent = item.type;

          const views = document.createElement("span");
          views.slot = "footer-end";
          views.textContent = "Views: " + item.numViews;

          const openItemAction = document.createElement("calcite-action");
          openItemAction.icon = "launch";
          openItemAction.slot = "footer-end";
          openItemAction.value = item;
          // Add event listener to open the item details page in a new window.
          openItemAction.addEventListener("click", (event) => {
            window.open(event.target.value.itemPageUrl);
          });

          card.appendChild(thumbnail);
          card.appendChild(title);
          card.appendChild(type);
          card.appendChild(views);
          card.appendChild(openItemAction);

          // Add each card to a new div with styling and add to the calcite panel.
          const div = document.createElement("item");
          div.style = "float: left; padding: 10px; display: inline-block;";
          div.appendChild(card);
          itemGallery.appendChild(div);
        });
      }

function openAlert(){
    alert("liste des items ok !");
}
async function load() {
    var portal = new Portal({url:CONFIG.portalUrl});
    portal.authMode="anonymous";
    await portal.load().then(listItems);
}

load();
