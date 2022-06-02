/**
 * Version 4.1.05
 * Tabs For Squarespace Sections
 * Copyright Will Myers
**/

(function () {
  let WMTabs = (function(){
    // Default settings
    let defaults = {
      layout: "horiztonal", // or 'vertical'
      event: "click", // or 'hover'
      inAnimation: "slideIn",
      mobileType: "tabs", // or 'accordions'
      on: {
        beforeOpenTab: null,
        afterOpenTab: null,
      },
      tabbingDelay: 80,
    };

    let global = window.wmTabsSettings || {};

    /**
     * Emit a custom event
     * @param  {String} type   The event type
     * @param  {Object} detail Any details to pass along with the event
     * @param  {Node}   elem   The element to attach the event to
     */
    function emitEvent(type, detail = {}, elem = document) {
      // Make sure there's an event type
      if (!type) return;

      // Create a new event
      let event = new CustomEvent(type, {
        bubbles: true,
        cancelable: true,
        detail: detail,
      });

      // Dispatch the event
      return elem.dispatchEvent(event);
    }
    
        /**
     * Debounce functions for better performance
     * (c) 2021 Chris Ferdinandi, MIT License, https://gomakethings.com
     * @param  {Function} fn The function to debounce
     */
    function debounce(fn) {
      // Setup a timer
      let timeout;

      // Return a function to run debounced
      return function () {
        // Setup the arguments
        let context = this;
        let args = arguments;

        // If there's a timer, cancel it
        if (timeout) {
          window.cancelAnimationFrame(timeout);
        }

        // Setup the new requestAnimationFrame()
        timeout = window.requestAnimationFrame(function () {
          fn.apply(context, args);
        });
      };
    }

    /**
     * Scroll To Top When Below
     */
    function scrollToTopOfTab(instance) {
      if (!instance.elements.header) return;
      let isBelow = false,
          tab = instance.elements.container,
          tabTop = tab.getBoundingClientRect().top - instance.elements.headerBottom;

      if (tabTop < 0) {
        isBelow = true;
        window.scrollTo({
          top: tab.getBoundingClientRect().top + document.documentElement.scrollTop - instance.elements.headerHeight,
          behavior: 'smooth'
        });
      }

      return isBelow
    }
    
    
        /**
     * Toggle the button
     * @param  {Constructor} instance The current instantiation
     */
    function openTab(tabNum, instance) {
      let elements = instance.elements,
          index = tabNum - 1;

      // Add Class to correct Button
      for (btn of elements.navButtons) {
        btn.classList.remove("active");
      }
      elements.navButtons[index].classList.add("active");

      // Add Class to correct section
      for (section of elements.sections) {
        section.classList.remove("active");
      }

      elements.sections[index].classList.add("active");

      emitEvent("wmTabs:afterOpen", {}, elements.container);
    }
    
    /**
     * Create Tab Buttonan event listener
     * @param  {Constructor} instance The current instantiation
     */
    function createEventListener(instance) {
      let elements = instance.elements;

      function handleEvent(e) {
        let target = e.target;
        if (target.closest(".wm-tab-button")) {
          let el = target.closest(".wm-tab-button"),
              index = Array.prototype.indexOf.call(el.parentElement.children, el) + 1;

          openTab(index, instance);
          scrollToTopOfTab(instance);
        }

      }

      for (button of elements.navButtons) {
        button.addEventListener('click', handleEvent);

        /*For Hover Events*/
        if (instance.settings.event == 'mouseover'){
          /*If mouse sit on tab for long enough, then trigger*/
          let timer;
          button.addEventListener(instance.settings.event, function(e){
            timer = setTimeout(function(){
              handleEvent(e);
            }, instance.settings.tabbingDelay);
          });
          button.addEventListener('mouseleave', function(){
            clearTimeout(timer);
          });
        }
      }
    }
    
    /**
     * Create Resize Event Listener
     * @param  {Constructor} instance The current instantiation
     **/
    function createResizeListener(instance) {
      function handleEvent() {
        setIndicator(instance);
        getNavWidth(instance);
        centerTabs(instance);
        getHeaderHeight(instance);
        setScrollIndicatorsVisibility(instance)
      }

      window.addEventListener("resize", handleEvent);
    }
    
    /**
     * Nav Scroll Listener
     * @param  {Constructor} instance The current instantiation
     **/
    function createTabNavScrollListener(instance) {
      function handleEvent() {
        setScrollIndicatorsVisibility(instance)
      }

      instance.elements.nav.addEventListener("scroll", handleEvent);
    }

    /**
      * Create Scroll Indicator Click Events 
      * @param  {Constructor} instance The current instantiation
     **/
    function createNavScrollIndicatorClickListener(instance) {
      function handleEvent(options) {
        scrollNav(instance, options)
      }

      instance.elements.forwardScrollIndicator
        .addEventListener("click", function() {
        handleEvent({amount: 0.5})
      });
      instance.elements.backScrollIndicator
        .addEventListener("click", function() {
        handleEvent({amount: -0.5})
      });
    }

    
    /**
     * Create Header Transition Event Listener
     * @param  {Constructor} instance The current instantiation
     **/
    function createHeaderTransitionListener(instance) {
      if (!instance.elements.header) return;
      let header = instance.elements.header;
      function handleEvent() {
        getHeaderHeight(instance);
      }

      window.addEventListener('scroll', function() {
        debounce(handleEvent())
      })

      header.addEventListener("transitionend", handleEvent);
    }
    
    /**
     * Show Indicators
     * @param  {Constructor} instance The current instantiation
     **/
    function showIndicators(instance) {
      instance.elements.indicator.style.visibility = "";
      instance.elements.indicatorTrack.style.visibility = "";
    }

    /**
     * Create Page Load Event Listener
     * @param  {Constructor} instance The current instantiation
     **/
    function createLoadListener(instance) {
      function handleEvent() {
        setIndicator(instance);
        getNavWidth(instance);
        centerTabs(instance);
        showIndicators(instance);
        getHeaderHeight(instance);
        setScrollIndicatorsVisibility(instance);
      }

      window.addEventListener("load", handleEvent);
      window.addEventListener("DOMContentLoaded", handleEvent);
    }

    /**
     * After Toggle Complete Event Listener
     * @param  {Node}        btn      The button to attach the listener to
     * @param  {Constructor} instance The current instantiation
     * @return {Function}             The callback function
     **/
    function afterTabOpenEventListener(instance) {
      function handleEvent() {
        getNavWidth(instance);
        setIndicator(instance);
        centerTabs(instance);
        scrollToTopOfTab(instance);
        window.dispatchEvent(new Event('resize'))
      }

      instance.elements.container.addEventListener("wmTabs:afterOpen", handleEvent);
    }
    
   /**
     * Create an event listener
     * @param  {Node}        btn      The button to attach the listener to
     * @param  {Constructor} instance The current instantiation
     * @return {Function}             The callback function
     **/
    function setIndicator(instance) {
      let elements = instance.elements,
        btn = elements.activeTab,
        leftPos = btn.offsetLeft,
        topPos = btn.offsetTop,
        width = btn.offsetWidth,
        height = btn.offsetHeight;

      // console.log(`Indicator Height = ${height}`);
      // console.log(`Indicator Width = ${height}`);

      elements.indicator.style.setProperty("--width", width + "px");
      elements.indicator.style.setProperty("--height", height + "px");
      elements.indicator.style.setProperty("--top", topPos + "px");
      elements.indicator.style.setProperty("--left", leftPos + "px");
    }

    /**
     * Get Width of the Tabs Track
     * @param  {instance} The settings for this instance
     */
    function getNavWidth(instance) {
      let elements = instance.elements;
      elements.indicatorTrack.style.width = "0px";
      elements.indicatorTrack.style.height = "0px";

      let navScrollWidth = elements.nav.scrollWidth + "px";
      let navScrollHeight = elements.nav.scrollHeight + "px";
      elements.indicatorTrack.style.width = "";
      elements.indicatorTrack.style.height = "";

      elements.indicatorTrack.style.setProperty("--width", navScrollWidth);
      elements.indicatorTrack.style.setProperty("--height", navScrollHeight);

      // console.log(`Indicator Track Height = ${navScrollHeight}`);
      // console.log(`Indicator Track Width = ${navScrollWidth}`);
    }
    
        /**
     * Center Tabs if off screen
     * @param  {instance} The settings for this instance
     */
    function centerTabs(instance) {
      let elements = instance.elements,
        btn = elements.activeTab,
        navScrollLeftPos = instance.elements.nav.scrollLeft,
        navWidth = instance.elements.nav.offsetWidth,
        btnWidth = btn.offsetWidth,
        activeBtnRightEdge = btn.offsetLeft + btnWidth,
        activeBtnLeftEdge = btn.offsetLeft,
        offset = navWidth * 0.05,
        viewableNavLeftEdge = navScrollLeftPos + offset,
        viewableNavRightEdge = navScrollLeftPos + navWidth - offset;

      //If off Right Side
      if (activeBtnRightEdge > viewableNavRightEdge) {
        let nextBtn = btn.nextElementSibling;
        if (nextBtn && nextBtn.matches(".wm-tab-button")) {
          instance.elements.nav.scrollLeft = navScrollLeftPos + nextBtn.offsetWidth + offset;
        } else {
          instance.elements.nav.scrollLeft = navScrollLeftPos + navWidth;
        }
      }

      //If off Left Side
      if (activeBtnLeftEdge < viewableNavLeftEdge) {
        let prevBtn = btn.previousElementSibling;
        if (prevBtn && prevBtn.matches(".wm-tab-button")) {
          instance.elements.nav.scrollLeft = navScrollLeftPos - prevBtn.offsetWidth - offset;
        } else {
          instance.elements.nav.scrollLeft = 0;
        }
      }

      // console.log(`Scroll Position = ${navScrollLeftPos}`)
      // console.log(`Nav Width = ${navWidth}`)
      // console.log(`Button Width = ${btnWidth}`)
      // console.log(`Active Button Right Edge = ${activeBtnRightEdge}`);
      // console.log(`Viewable Nav Right Edge = ${viewableNavRightEdge}`)
      // console.log(`Active Button Left Edge = ${activeBtnLeftEdge}`)
      // console.log(`Viewable Nav Left Edge = ${viewableNavLeftEdge}`)
    }
    
    /**
     * Scroll the Tab Navigation Some Amount
     * @param  {instance} The settings for this instance
     */
    function scrollNav(instance, options) {
      let currentPos = instance.elements.nav.scrollLeft,
          amount = instance.elements.nav.offsetWidth * options.amount;
      
      console.log(options.amount)
      instance.elements.nav.scrollLeft = instance.elements.nav.scrollLeft + amount;
    }
    
    /**
     * Show or Hide the Tab Nav Indicators
     * @param  {instance} The settings for this instance
     */
    function setScrollIndicatorsVisibility(instance) {
      let forwardSI = instance.elements.forwardScrollIndicator,
          backSI = instance.elements.backScrollIndicator,
          scrollWidth = instance.elements.nav.scrollWidth,
          navScrollLeftPos = instance.elements.nav.scrollLeft,
          navWidth = instance.elements.nav.offsetWidth,
          viewableNavRightEdge = navScrollLeftPos + navWidth;
      
      navScrollLeftPos > 25 ? backSI.classList.add('show') : backSI.classList.remove('show');
      viewableNavRightEdge + 25 < scrollWidth ? forwardSI.classList.add('show') : forwardSI.classList.remove('show');

    //  console.log('navScrollLeftPos', navScrollLeftPos)
    //  console.log('viewableNavRightEdge', viewableNavRightEdge)
    //  console.log('scrollWidth', scrollWidth)
    }

    /**
     * Get the Header Height and Set on Tabs Container
     * @param  {instance} The settings for this instance
     */
    function getHeaderHeight(instance) {
      if (!instance.elements.header) return;

      let elements = instance.elements,
          header = elements.header,
          headerBottom = header.getBoundingClientRect().bottom > 0 ? header.getBoundingClientRect().bottom - 1 + "px" : 0 + "px";

      elements.container.style.setProperty("--header-bottom", headerBottom);

      // console.log(`HeaderBottom = ${headerBottom}`);
    }

    /**
     * Set Data Attributes on Tabs Component
     * @param  {instance} The settings for this instance
     */
    function getLocalSettings(el) {
      let localSettings = {},
          data = el.dataset;

      if (data.layout) localSettings.layout = data.layout;
      if (data.event) {
        if (data.event == "hover") data.event = "mouseover";
        localSettings.event = data.event;
      }

      return localSettings;
    }

    /**
     * The constructor object
     * @param {String} selector The selector for the element to render into
     * @param {Object} options  User options and settings
     */
    function Constructor(el, options = {}) {
      //Add CSS Function
      this.addCSS();
      let local = getLocalSettings(el);

      this.settings = Object.assign({}, defaults, global, local, options);
      this.allowTabbing = true;
      
      // Add Elements Obj
      this.elements = {
        container: el,
        get tabsCount() {
          let tabsCount = document.querySelectorAll('.wm-tabs-block').length;
          return tabsCount;
        },
        get header() {
          let header = document.querySelector('#header') || document.querySelector('header') || null;
          return header
        },
        get headerHeight() {
          if (!this.header) return null;
          let header = document.querySelector('#header') || document.querySelector('header'),
              headerHeight = header.getBoundingClientRect().height;
          return headerHeight
        },
        get headerBottom() {
          if (!this.header) return null;
          let header = document.querySelector('#header') || document.querySelector('header'),
              headerBottom = header.getBoundingClientRect().bottom;
          return headerBottom
        },
        get navWrapper() {
          return this.container.querySelector(".nav-container");
        },
        get nav() {
          return this.container.querySelector("nav");
        },
        get navButtons() {
          return this.container.querySelectorAll("nav > button");
        },
        get indicator() {
          return this.container.querySelector("nav > .indicator");
        },
        get indicatorTrack() {
          return this.container.querySelector("nav > .indicator-track");
        },
        get forwardScrollIndicator() {
          return this.container.querySelector(".nav-container .scroll-forward-arrow");
        },
        get backScrollIndicator() {
          return this.container.querySelector(".nav-container .scroll-back-arrow");
        },
        get article() {
          return this.container.querySelector("article");
        },
        get sections() {
          return this.container.querySelectorAll("article > section");
        },
        get activeTab() {
          return this.container.querySelector("nav > button.active");
        },
        get activeSection() {
          return this.container.querySelector("section.active");
        },
      };

      // Add Loading Event Listener
      createLoadListener(this);

      // Add Resize Event Listener
      createResizeListener(this);

      // Add Header Transition Event Listener
      createHeaderTransitionListener(this);

      // Create the Toggle event listener
      createEventListener(this);
      
      // Create scroll listener when nav is scrolled
      createTabNavScrollListener(this);
      createNavScrollIndicatorClickListener(this);

      // Create the After Tab Open event listener
      afterTabOpenEventListener(this);

      this.initTab();
    }

    /**
     * Open the Correct Tage
     * @param  {Constructor} instance The current instantiation
     **/
    Constructor.prototype.initTab = function () {
      const url = new URL(window.location.href),
            searchParams = url.searchParams.getAll("wmTabs");

      openTab(1, this);
      if (searchParams) {
        for (param of searchParams) {
          let container = this.elements.nav,
              tab = container.querySelector(`[data-id="${param}"]`);

          if (tab) {
            let i = Array.prototype.indexOf.call(container.children, tab) + 1;
            openTab(i, this);
          }
        }
      }
    };

    /**
     * Add CSS
     */
    Constructor.prototype.addCSS = function () {
      let cssFile = document.querySelector("#wm-tabs-css");
      function addCSSFile() {
        let url = "https://assets.codepen.io/3198845/WMContentTabs62220v4.1.4.min.css";
        let head = document.getElementsByTagName("head")[0],
            link = document.createElement("link");
        link.rel = "stylesheet";
        link.id = "wm-tabs-css";
        link.type = "text/css";
        link.href = url;
        link.onload = function () {
          loaded();
        };
        
        head.prepend(link);
      }

      function loaded() {
        const event = new Event("wmtabs:css-loaded");
        window.dispatchEvent(event);
        document.querySelector("body").classList.add("wm-tabs-css-loaded");
      }

      if (!cssFile) {
        addCSSFile();
      } else {
        document.head.prepend(cssFile);
        loaded();
      }
    };

    return Constructor;

  }());

  let BuildTabsHTML = (function () {
    // Default settings
    let defaults = {
      layout: "horiztonal", // or 'vertical'
      event: "click", // or 'hover'
      inAnimation: "slideIn",
      mobileType: "tabs", // or 'accordions'
      on: {
        beforeOpenTab: null,
        afterOpenTab: null,
      },
      tabbingDelay: 80,
    };

    let global = window.wmTabsSettings || {};

    /**
     * Inject the button into the DOM
     * @param  {Constructor} intance The settings for this instance
     */
    function injectTemplate(instance) {
      // Create button
      let container = document.createElement("div");
      container.classList.add("wm-tabs-block");
      container.id = 'wm-tab-' + (instance.elements.tabsCount + 1);
      container.dataset.layout = instance.settings.layout;
      
      let backIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-labelledby="title" role="img" xmlns:xlink="http://www.w3.org/1999/xlink">
  <title>Back</title>
  <path data-name="layer1" fill="none" stroke="#202020" stroke-miterlimit="10" stroke-width="2" d="M39 20.006L25 32l14 12.006" stroke-linejoin="round" stroke-linecap="round"></path>
</svg>`, 
          forwardIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-labelledby="title" role="img" xmlns:xlink="http://www.w3.org/1999/xlink">
  <title>Forward</title>
  <path data-name="layer1" fill="none" stroke="#202020" stroke-miterlimit="10" stroke-width="2" d="M26 20.006L40 32 26 44.006" stroke-linejoin="round" stroke-linecap="round"></path>
</svg>`

      //Insert container Just above first section
      instance.elements.firstBlock.parentNode.insertBefore(container, instance.elements.firstBlock);

      let template = `
      <div class="nav-container">
        <span class="scrollable-indicator scroll-back-arrow" tabindex="0" role="button">${backIcon}</span>
        <div class="nav-background"></div>
        <nav>
          <span class="indicator"></span>
          <span class="indicator-track"></span>
        </nav>
        <span class="scrollable-indicator scroll-forward-arrow" tabindex="0" role="button">${forwardIcon}</span>
      </div>
      <article>
        <div class="panels-background"></div>
      </article>
        `;

      container.innerHTML = template;
      instance.elements.container = container;

      return container;
    }

    /**
     * Inject the sections into the DOM
     * @param  {instance} The settings for this instance
     */
    function addSections(instance) {
      let elements = instance.elements,
        nextEl = elements.container.nextElementSibling,
        sectionIndex = 0,
        j = 1;

      nextEl.classList.add("hide-block");
      instance.addSection(instance.elements.article);

      //Add Blocks to Section
      while (!nextEl.querySelector(".wm-tabs-end") && 200 > j) {
        elements.container.querySelectorAll("article > section")[sectionIndex].append(nextEl);
        nextEl = elements.container.nextElementSibling;
        if (!nextEl) break;

        if (nextEl.querySelector(".wm-tab-start")) {
          nextEl.classList.add("hide-block");
          instance.addSection(instance.elements.article);
          sectionIndex++;
        }
        j = j + 1;
      }

      elements.container.querySelectorAll(".wm-tab-start").forEach((el) => el.classList.add("loaded"));

      return elements.sections;
    }

    /**
     * Inject buttons into the Tabs Component
     * @param  {instance} The settings for this instance
     */
    function addButtons(instance) {
      let elements = instance.elements,
        currentNav = elements.nav.innerHTML,
        htmlString = "";

      //Loop through each section
      for (section of elements.sections) {
        let el = section.querySelector(".wm-tab-start");
        let btn = instance.buildButton(el);
        htmlString += btn;
      }

      //Add Buttons to Nav
      elements.nav.innerHTML = htmlString + currentNav;

      return elements.navButtons;
    }


    /**
     * Set Data Attributes on Tabs Component
     * @param  {instance} The settings for this instance
     */
    function getLocalSettings(el) {
      el = el.querySelector(".wm-tab-start");
      let localSettings = {},
        data = el.dataset;

      if (data.layout) localSettings.layout = data.layout;
      if (data.event) {
        if (data.event == "hover") data.event = "mouseover";
        localSettings.event = data.event;
      }

      return localSettings;
    }

    /**
     * Breakdown HTML when in Edit Mode
     * @param  {Constructor} instance The current instantiation
     */
    function watchForEditMode(instance) {
      let elemToObserve = document.querySelector("body");
      let prevClassState = elemToObserve.classList.contains("sqs-edit-mode-active");
      let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.attributeName == "class") {
            let currentClassState = mutation.target.classList.contains("sqs-edit-mode-active");
            if (prevClassState !== currentClassState) {
              prevClassState = currentClassState;
              if (currentClassState) instance.destroy(instance);
            }
          }
        });
      });
      observer.observe(elemToObserve, { attributes: true });
    }

    /**
     * The constructor object
     * @param {String} selector The selector for the element to render into
     * @param {Object} options  User options and settings
     */
    function Constructor(el, options = {}) {

      let local = getLocalSettings(el);

      this.settings = Object.assign({}, defaults, global, local, options);
      this.allowTabbing = true;

      // Add Elements Obj
      this.elements = {
        firstBlock: el,
        container: null,
        get tabsCount() {
          let tabsCount = document.querySelectorAll('.wm-tabs-block').length;
          return tabsCount;
        },
        get header() {
          let header = document.querySelector('#header') || document.querySelector('header');
          return header
        },
        get headerHeight() {
          let header = document.querySelector('#header') || document.querySelector('header'),
              headerHeight = header.getBoundingClientRect().height;
          return headerHeight
        },
        get headerBottom() {
          let header = document.querySelector('#header') || document.querySelector('header'),
              headerBottom = header.getBoundingClientRect().bottom;
          return headerBottom
        },
        get navWrapper() {
          return this.container.querySelector(".nav-container");
        },
        get nav() {
          return this.container.querySelector("nav");
        },
        get navButtons() {
          return this.container.querySelectorAll("nav > button");
        },
        get indicator() {
          return this.container.querySelector("nav > .indicator");
        },
        get indicatorTrack() {
          return this.container.querySelector("nav > .indicator-track");
        },
        get article() {
          return this.container.querySelector("article");
        },
        get sections() {
          return this.container.querySelectorAll("article > section");
        },
        get activeTab() {
          return this.container.querySelector("nav > button.active");
        },
        get activeSection() {
          return this.container.querySelector("section.active");
        },
      };

      // Inject template into the DOM
      injectTemplate(this);

      // Inject Sections into Container
      addSections(this);

      // Inject Buttons into Nav Wrapper
      addButtons(this);

      // Breakdown when in Edit Mode
      watchForEditMode(this);

      new WMTabs(this.elements.container);
    }

    /**
     * Build a Tab Button Element
     *
     */
    Constructor.prototype.buildButton = function (el) {
      //Build Each Button and add to string
      let innerHTML = el.innerHTML,
        id = el.id;
      return `<button data-id="${id}" class="wm-tab-button">${innerHTML}</button>`;
    };

    /**
     * Build a Tab Section Container
     * {Node} article - the Article Element
     */
    Constructor.prototype.addSection = function (article) {
      let section = document.createElement("section");
      article.insertBefore(section, article.querySelector(".panels-background"));
      //article.innerHTML += `<section></section>`;
      newSection = article.querySelector(":scope > section:last-of-type");
      return newSection;
    };

    /**
     * Destroy this instance
     */
    Constructor.prototype.destroy = function (instance) {
      //Deconstruct the Tabs Element
      function removeElements() {
        if (!instance._elements) { return }
        
        for (section of instance._elements.sections) {
          insertAfter(section, instance._elements.container);
        }
        instance._elements.container.remove();
      }

      //Insert After Helper Function
      function insertAfter(newNode, existingNode) {
        existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
      }

      removeElements();
    };
    
    
    return Constructor;
  })();

  //Build HTML
  let toggleSections = document.querySelectorAll(".wm-tab-start:not(.loaded)");
  for (const el of toggleSections) {
    let block = el.closest(".sqs-block");
    //Stop if already within a Tabs Section
    if (!el.matches(".loaded")) {
      new BuildTabsHTML(block, {});
    }
  }
  
  //Add Javascript
  let tabsContainers = document.querySelectorAll(".wm-tabs-block:not(.loaded)");
  for (const tab of tabsContainers) {
    if (!tab.matches(".loaded")) {
      new WMTabs(tab, {});
    }
  }
})();