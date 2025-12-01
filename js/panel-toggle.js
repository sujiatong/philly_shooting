document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("feature-select");
  const fatalWrapper = document.getElementById("fatal-chart-wrapper");
  //const sexWrapper = document.getElementById("sex-chart-wrapper");
  const raceWrapper = document.getElementById("race-chart-wrapper");
  //const ageWrapper = document.getElementById("age-chart-wrapper");
  const pyramidWrapper = document.getElementById("pyramid-chart-wrapper");



  if (!select || !fatalWrapper || !raceWrapper) {
    console.warn("[panel-toggle] elements not found");
    return;
  }

  function updateFeaturePanel() {
    const value = select.value;

    // 先全部隱藏
    fatalWrapper.style.display = "none";
    //sexWrapper.style.display = "none";
    raceWrapper.style.display = "none";
    //ageWrapper.style.display = "none";
    pyramidWrapper.style.display = "none";


    // 再顯示被選中的那一個
    if (value === "fatal") {
      fatalWrapper.style.display = "block";
    } //else if (value === "sex") {
      //sexWrapper.style.display = "block";
    //} 
    else if (value === "race") {
      raceWrapper.style.display = "block";
    }
    // else if (value === "age") {
     // ageWrapper.style.display = "block";
    //}
    else if (value === "pyramid") {
      pyramidWrapper.style.display = "block";
    }

  }

  // 初始化一次
  updateFeaturePanel();

  // dropdown 變化時切換
  select.addEventListener("change", updateFeaturePanel);
});

  