import Home from "@/views/Poll.vue";
import Poll from "@/views/PollEditorView.vue";
import PollCreation from "@/views/PollCreation.vue";

//ajout des routes utilisées dans le dashboard
export const routes = [
    { hash: "#home", label: "Accueil", component: Home },
    { hash: "#polls", label: "Édition", component: Poll },
    { hash: "#create", label: "Création", component: PollCreation },
];
