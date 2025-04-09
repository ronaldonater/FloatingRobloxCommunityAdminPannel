// ==UserScript==
// @name         Roblox Community Floating Admin Panel
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Adds a floating window with admin panel access within Roblox community home pages
// @author       ronaldonater
// @match        https://www.roblox.com/communities/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Add styles for our floating window
    GM_addStyle(`
        #admin-panel-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 400px;
            height: 500px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            resize: both; /* Enable resizing */
            min-width: 300px; /* Minimum size constraints */
            min-height: 200px;
        }
        #admin-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background-color: #00a2ff;
            color: white;
            cursor: move;
            min-height: 40px;
            box-sizing: border-box;
            border-radius: 8px 8px 0 0;
        }
        #admin-panel-content {
            flex: 1;
            border: none;
            width: 100%;
            height: calc(100% - 40px); /* Subtract header height */
            background-color: #fff;
            display: block;
        }
        #admin-panel-close, #admin-panel-minimize {
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
        }
        #admin-panel-button {
            position: fixed;
            bottom: 40px;
            right: 9px;
            background-color: #00a2ff;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .hidden {
            display: none !important;
        }
        .minimized {
            height: 40px !important;
            resize: none !important;
            min-height: 40px !important;
            border-radius: 8px !important;
        }
        .minimized #admin-panel-content {
            display: none !important;
        }
        .minimized #resize-handle {
            display: none !important;
        }
        .minimized #admin-panel-header {
            border-radius: 8px !important;
        }
        /* Custom resize handle to make it more visible */
        #resize-handle {
            position: absolute;
            right: 0;
            bottom: 0;
            width: 15px;
            height: 15px;
            cursor: nwse-resize;
            background-color: rgba(0, 162, 255, 0.5);
            border-top-left-radius: 3px;
        }
    `);

    // Extract the group ID from the URL
    function getGroupId() {
        const url = window.location.href;

        // Try to match ID from configure URL
        let match = url.match(/\/communities\/configure\?id=(\d+)/);
        if (match) return match[1];

        // Try to match ID from communities URL
        match = url.match(/\/communities\/(\d+)\//);
        if (match) return match[1];

        return null;
    }

    // Create the admin panel button
    function createAdminButton() {
        const button = document.createElement('button');
        button.id = 'admin-panel-button';
        button.innerHTML = '⚙️';
        button.title = 'Open Admin Panel';
        button.addEventListener('click', toggleAdminPanel);
        document.body.appendChild(button);
    }

    // Create the admin panel window
    function createAdminPanel() {
        const groupId = getGroupId();
        if (!groupId) return;

        const container = document.createElement('div');
        container.id = 'admin-panel-container';
        container.className = 'hidden';

        container.innerHTML = `
            <div id="admin-panel-header">
                <span>Group Admin Panel</span>
                <div>
                    <button id="admin-panel-minimize" title="Minimize">−</button>
                    <button id="admin-panel-close" title="Close">✕</button>
                </div>
            </div>
            <iframe id="admin-panel-content" sandbox="allow-same-origin allow-scripts allow-forms" src="about:blank"></iframe>
            <div id="resize-handle"></div>
        `;

        document.body.appendChild(container);

        // Add event listeners
        document.getElementById('admin-panel-close').addEventListener('click', hideAdminPanel);
        document.getElementById('admin-panel-minimize').addEventListener('click', minimizeAdminPanel);

        // Make the window draggable
        makeDraggable(container);

        // Make the window manually resizable for browsers that don't support the resize property well
        makeResizable(container);

        // Set iframe src after adding sandbox attribute
        const iframe = document.getElementById('admin-panel-content');
        iframe.src = `https://www.roblox.com/communities/configure?id=${groupId}#!/members`;

        // Prevent iframe from redirecting top window and modify layout
        iframe.addEventListener('load', function() {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

                // Create a style element to improve layout after sidebar removal
                const style = iframeDoc.createElement('style');
                style.textContent = `
                    /* Hide sidebar elements */
                    .navigation, .sidebar-menu, .left-navigation, .rbx-left-col, .rbx-navbar {
                        display: none !important;
                    }

                    /* Hide the top navigation bar within the iframe (targeted based on image) */
                    .navbar-container, .dialog-header, .navbar-universal, .dialog-universal-body > div:first-child,
                    .icon-logo, .icon-nav-menu, .navbar-header, .dialog-header-container,
                    .navbar-search, .dialog-header-container, .container-header > .top-bar,
                    .container-header > nav, .group-configure-header-container {
                        display: none !important;
                    }

                    /* Specific targeting for the top bar with icons shown in your image */
                    .dialog-header, .dialog-universal-body > div:first-child,
                    .container-header .top-bar, .page-content > div:first-child,
                    .configure-header, .rbx-header {
                        display: none !important;
                    }

                    /* Target specific elements that contain icons/buttons in top bar */
                    .icon-nav-search, .icon-nav-friends, .icon-nav-message, .icon-nav-shop, .icon-nav-settings,
                    div[role="navigation"], div[role="banner"] {
                        display: none !important;
                    }

                    /* Expand main content to full width and adjust top margin to compensate for removed top bar */
                    .rbx-middle-col, .rbx-right-col, .content, .rbx-content, .container-main,
                    .container-header, .group-configure-section, .configure-container,
                    .rbx-body, body > div, .group-container, .dialog-container, .dialog-body,
                    .dialog-universal-body {
                        width: 100% !important;
                        max-width: 100% !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                        padding-left: 10px !important;
                        padding-right: 10px !important;
                        margin-top: 0 !important; /* Remove top margin to fill space */
                    }

                    /* Ensure content starts at the top */
                    body, html, .dialog-universal-body, .dialog-body, .configure-container {
                        margin-top: 0 !important;
                        padding-top: 0 !important;
                    }

                    /* Fix potential layout issues */
                    .container-fluid {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                    }

                    /* Ensure content is properly centered */
                    .configure-section-content {
                        margin: 0 auto !important;
                    }

                    /* Additional fixes for specific Roblox elements */
                    .group-configure-card {
                        width: 100% !important;
                    }

                    .tab-content {
                        padding-left: 0 !important;
                        width: 100% !important;
                    }

                    .tab-pane {
                        width: 100% !important;
                    }

                    /* Make configure content take full height */
                    .configure-content, .configure-section-content {
                        height: 100% !important;
                        margin-top: 0 !important;
                    }
                `;

                // Add the style to the iframe document
                iframeDoc.head.appendChild(style);

                // Also try to directly remove the sidebar elements and top bar
                const elementsToRemove = iframeDoc.querySelectorAll(
                    '.navigation, .sidebar-menu, .left-navigation, .rbx-left-col, .rbx-navbar, ' +
                    '.navbar-container, .dialog-header, .navbar-universal, .dialog-header-container, ' +
                    '.icon-nav-search, .icon-nav-friends, .icon-nav-message, .icon-nav-shop, .icon-nav-settings, ' +
                    'div[role="navigation"], div[role="banner"], .container-header .top-bar, ' +
                    '.page-content > div:first-child, .configure-header, .rbx-header'
                );

                elementsToRemove.forEach(el => {
                    el.style.display = 'none';
                });

                // Set base target and override top/parent
                const base = iframeDoc.createElement('base');
                base.target = '_self';
                iframeDoc.head.appendChild(base);

                // Override any attempts to change top window location
                iframe.contentWindow.top = iframe.contentWindow;
                iframe.contentWindow.parent = iframe.contentWindow;

                // Add a mutation observer to handle dynamically loaded content
                const observer = new MutationObserver(function(mutations) {
                    // Re-apply our styles when content changes
                    const mainContainers = iframeDoc.querySelectorAll(
                        '.rbx-middle-col, .rbx-right-col, .content, .rbx-content, .container-main, ' +
                        '.container-header, .group-configure-section, .configure-container, .tab-content, .tab-pane, ' +
                        '.dialog-body, .dialog-universal-body');

                    mainContainers.forEach(el => {
                        el.style.width = '100%';
                        el.style.maxWidth = '100%';
                        el.style.marginLeft = '0';
                        el.style.marginRight = '0';
                        el.style.paddingLeft = '10px';
                        el.style.paddingRight = '10px';
                        el.style.marginTop = '0';
                    });

                    // Hide any newly added elements we don't want
                    const newElementsToRemove = iframeDoc.querySelectorAll(
                        '.navigation, .sidebar-menu, .left-navigation, .rbx-left-col, .rbx-navbar, ' +
                        '.navbar-container, .dialog-header, .navbar-universal, .dialog-header-container, ' +
                        '.icon-nav-search, .icon-nav-friends, .icon-nav-message, .icon-nav-shop, .icon-nav-settings, ' +
                        'div[role="navigation"], div[role="banner"], .container-header .top-bar, ' +
                        '.page-content > div:first-child, .configure-header, .rbx-header'
                    );

                    newElementsToRemove.forEach(el => {
                        el.style.display = 'none';
                    });
                });

                // Start observing the document with the configured parameters
                observer.observe(iframeDoc.body, { childList: true, subtree: true });

            } catch (e) {
                console.log('Could not modify iframe content due to same-origin policy:', e);
            }
        });
    }

    // Make an element resizable with a custom resize handle
    function makeResizable(element) {
        const resizeHandle = element.querySelector('#resize-handle');
        let isResizing = false;
        let originalWidth, originalHeight, originalX, originalY;

        resizeHandle.addEventListener('mousedown', function(e) {
            isResizing = true;
            originalWidth = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
            originalHeight = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
            originalX = e.clientX;
            originalY = e.clientY;
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;

            const width = originalWidth + (e.clientX - originalX);
            const height = originalHeight + (e.clientY - originalY);

            if (width > 300) { // Minimum width
                element.style.width = width + 'px';
            }

            if (height > 200) { // Minimum height
                element.style.height = height + 'px';
            }
        });

        document.addEventListener('mouseup', function() {
            isResizing = false;
        });
    }

    // Toggle the admin panel
    function toggleAdminPanel() {
        const panel = document.getElementById('admin-panel-container');
        const button = document.getElementById('admin-panel-button');

        if (!panel) {
            createAdminPanel();
            button.classList.add('hidden');
            document.getElementById('admin-panel-container').classList.remove('hidden');
        } else {
            panel.classList.toggle('hidden');
            button.classList.toggle('hidden');

            // If it was minimized before, restore it
            if (panel.classList.contains('minimized')) {
                panel.classList.remove('minimized');
                document.getElementById('admin-panel-minimize').textContent = '−';
                document.getElementById('admin-panel-minimize').title = 'Minimize';
            }
        }
    }

    // Hide the admin panel
    function hideAdminPanel() {
        document.getElementById('admin-panel-container').classList.add('hidden');
        document.getElementById('admin-panel-button').classList.remove('hidden');
    }

    // Minimize the admin panel
    function minimizeAdminPanel() {
        const panel = document.getElementById('admin-panel-container');
        const button = document.getElementById('admin-panel-minimize');

        panel.classList.toggle('minimized');

        // Update button text based on state
        if (panel.classList.contains('minimized')) {
            button.textContent = '+';
            button.title = "Maximize";
        } else {
            button.textContent = '−';
            button.title = "Minimize";
        }
    }

    // Make an element draggable
    function makeDraggable(element) {
        const header = element.querySelector('#admin-panel-header');
        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', function(e) {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;

            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            element.style.bottom = 'auto';
            element.style.right = 'auto';
        });

        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
    }

    // Initialize when the page loads
    window.addEventListener('load', function() {
        // Only run on group pages
        if (window.location.href.includes('roblox.com/communities/')) {
            createAdminButton();
        }
    });
})();
