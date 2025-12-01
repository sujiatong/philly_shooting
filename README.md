# Shooting Victims dashboard

## Table of Contents

<details>

   <summary>Contents</summary>

1. [Summary](#summary)
1. [data](#data)

</details>


## Summary 

An interactive web dashboard that explores shooting incidents in Philadelphia using a combination of **maps** and **charts**.  
The app focuses on *who* is affected, *when* incidents happen, and *how severe* the outcomes are.


demo： https://sujiatong.github.io/philly_shooting/

## Data

**Philadelphia Open Data Portal – Shooting victims**： https://opendataphilly.org/datasets/shooting-victims/

## 🎯 Goals

- Visualize the spatial and temporal patterns of shootings in Philadelphia.
- Highlight **victim characteristics** (age, sex, race) and **case severity** (fatal vs non-fatal).
- Provide an exploratory tool that feels like a lightweight product dashboard, not just a class assignment.

## 🗺️ Main Features

- **Interactive Leaflet map**
  - Points colored by fatal vs non-fatal outcome.
  - Pop-ups showing key case details (date, location, age, sex, race, fatality).
  - Map updates in response to filters and analysis mode.

- **Flexible filters**
  - **Location search** box with live suggestions.
  - **Date range filter** with “reset / show all” option.
  - Dropdown to switch between different analytical views.

- **Analytical side panel (Chart.js)**
  - **Monthly time series** of cases over time.
  - **Fatal vs Non-fatal** horizontal bar (share of victims, with % labels).
  - **Race distribution** bar chart (share of victims).
  - **Age–Sex pyramid** (population-pyramid style chart):
    - Age groups: 0–17, 18–29, 30–44, 45–64, 65+
    - Separate bars for male and female
    - Expressed as percentage share of all victims.

- **Product-like UI**
  - Clean top header with title and filters.
  - Side panel layout designed for readability on desktop screens.
  - Consistent color palette and typography tuned for a dark-on-light map dashboard.



## 🧠 Tech Stack

- **JavaScript** (vanilla)
- **Leaflet** for mapping
- **Chart.js + chartjs-plugin-datalabels** for charts
- **HTML/CSS** for layout and styling