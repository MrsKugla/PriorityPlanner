import { mount } from "svelte";
import "./styles/base.css";
import "./styles/neumorphism.css";
import "./styles/skeuomorphism.css";
import "./styles/claymorphism.css";
import App from "./App.svelte";
import { applica } from "./lib/aspetto.svelte";

applica();
mount(App, { target: document.getElementById("app")! });
