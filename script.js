// API Base URL
const API_BASE_URL = 'https://www.thecocktaildb.com/api/json/v1/1';

// Current search type
let currentSearchType = 'ingredient';

// Initialize
$(document).ready(function() {
    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100
    });
    
    setupNavigation();
    setupEventListeners();
});

// Setup Navigation
function setupNavigation() {
    const mobileMenuToggle = $('#mobile-menu-toggle');
    const navMenu = $('#nav-menu');
    const navOverlay = $('#nav-overlay');
    const dropdowns = $('.dropdown');

    // Mobile menu toggle
    mobileMenuToggle.on('click', function() {
        const isActive = $(this).hasClass('active');
        $(this).toggleClass('active');
        navMenu.toggleClass('active');
        navOverlay.toggleClass('active');
        $('body').toggleClass('menu-open');
        $(this).attr('aria-expanded', !isActive);
    });

    // Close menu when clicking overlay
    navOverlay.on('click', function() {
        mobileMenuToggle.removeClass('active');
        navMenu.removeClass('active');
        navOverlay.removeClass('active');
        $('body').removeClass('menu-open');
        mobileMenuToggle.attr('aria-expanded', 'false');
    });

    // Dropdown toggle for desktop
    dropdowns.each(function() {
        const dropdown = $(this);
        const dropdownToggle = dropdown.find('.dropdown-toggle');

        dropdownToggle.on('click', function(e) {
            if ($(window).width() > 992) {
                e.preventDefault();
                dropdowns.not(dropdown).removeClass('active');
                dropdown.toggleClass('active');
            }
        });
    });

    // Close dropdowns when clicking outside (desktop only)
    $(document).on('click', function(e) {
        if ($(window).width() > 992 && !$(e.target).closest('.dropdown').length) {
            dropdowns.removeClass('active');
        }
    });

    // Close mobile menu when clicking on a nav link (dropdown links handled separately)
    $('.nav-link').on('click', function() {
        if ($(window).width() <= 992 && !$(this).hasClass('dropdown-toggle')) {
            navMenu.removeClass('active');
            mobileMenuToggle.removeClass('active');
            navOverlay.removeClass('active');
            $('body').removeClass('menu-open');
            mobileMenuToggle.attr('aria-expanded', 'false');
        }
    });

    // Handle dropdown toggle in mobile
    $('.dropdown-toggle').on('click', function(e) {
        if ($(window).width() <= 992) {
            e.preventDefault();
            const dropdown = $(this).closest('.dropdown');
            dropdowns.not(dropdown).removeClass('active');
            dropdown.toggleClass('active');
        }
    });

    // Smooth scroll for anchor links
    $('a[href^="#"]').on('click', function(e) {
        const href = $(this).attr('href');
        
        // Don't prevent default for dropdown links or empty hashes
        // Dropdown links are handled separately
        if (href === '#' || $(this).hasClass('dropdown-link')) {
            return;
        }
        
        // Prevent scrolling for ingredients link (it's a dropdown toggle)
        if (href === '#ingredients' || $(this).hasClass('dropdown-toggle')) {
            e.preventDefault();
            return;
        }
        
        const target = $(href);
        if (target.length) {
            e.preventDefault();
            
            // For cocktails link, fetch and display all cocktails
            if (href === '#cocktails') {
                e.preventDefault();
                
                // Close mobile menu if open
                if ($(window).width() <= 992) {
                    mobileMenuToggle.removeClass('active');
                    navMenu.removeClass('active');
                    navOverlay.removeClass('active');
                    $('body').removeClass('menu-open');
                    mobileMenuToggle.attr('aria-expanded', 'false');
                }
                
                // Fetch all cocktails
                fetchAllCocktails();
                return;
            }
            
            // Close mobile menu if open
            if ($(window).width() <= 992) {
                mobileMenuToggle.removeClass('active');
                navMenu.removeClass('active');
                navOverlay.removeClass('active');
                $('body').removeClass('menu-open');
                mobileMenuToggle.attr('aria-expanded', 'false');
            }
            
            // Calculate offset based on section
            let offset = 80;
            if (href === '#home') {
                offset = 0;
            }
            
            $('html, body').animate({
                scrollTop: target.offset().top - offset
            }, 800);
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Tab buttons (if they exist)
    $('.tab-btn').on('click', function() {
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        currentSearchType = $(this).data('search-type');
        updatePlaceholder();
    });

    // Search button
    $('#search-btn').on('click', handleSearch);

    // Enter key in search input
    $('#search-input').on('keypress', function(e) {
        if (e.which === 13) {
            handleSearch();
        }
    });

    // Quick ingredient buttons (from old design - keep for compatibility)
    $('.quick-btn').on('click', function() {
        const ingredient = $(this).data('ingredient');
        $('#search-input').val(ingredient);
        currentSearchType = 'ingredient';
        $('.tab-btn').removeClass('active');
        $('.tab-btn[data-search-type="ingredient"]').addClass('active');
        handleSearch();
    });

    // Popular ingredients list items (new design)
    $('.ingredient-item').on('click', function() {
        const ingredient = $(this).text().trim().toLowerCase();
        $('#search-input').val(ingredient);
        currentSearchType = 'ingredient';
        handleSearch();
    });

    // Dropdown ingredient links
    $('.dropdown-link').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        
        const ingredient = $(this).data('ingredient');
        if (ingredient) {
            // Close dropdown on desktop
            if ($(window).width() > 992) {
                $(this).closest('.dropdown').removeClass('active');
            }
            
            // Close mobile menu if open
            if ($(window).width() <= 992) {
                navMenu.removeClass('active');
                mobileMenuToggle.removeClass('active');
                navOverlay.removeClass('active');
                $('body').removeClass('menu-open');
                mobileMenuToggle.attr('aria-expanded', 'false');
            }
            
            $('#search-input').val(ingredient);
            currentSearchType = 'ingredient';
            handleSearch();
        }
    });

    // Modal close
    $('#modal-close').on('click', closeModal);
    
    // Close modal on overlay click
    $('#cocktail-modal').on('click', function(e) {
        if ($(e.target).hasClass('modal-overlay')) {
            closeModal();
        }
    });

    // Close modal on Escape key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && !$('#cocktail-modal').hasClass('hidden')) {
            closeModal();
        }
    });
}

// Update placeholder based on search type
function updatePlaceholder() {
    const placeholders = {
        ingredient: 'e.g., vodka, rum, gin...',
        category: 'e.g., Cocktail, Shot, Ordinary Drink...',
        name: 'e.g., Mojito, Margarita...'
    };
    $('#search-input').attr('placeholder', placeholders[currentSearchType] || placeholders.ingredient);
}

// Handle Search - API INTERACTION
async function handleSearch() {
    const query = $('#search-input').val().trim();
    
    if (!query) {
        showError('Please enter a search term');
        return;
    }

    hideError();
    showLoading();
    hideCocktails();

    try {
        let url;
        
        // Build API URL based on search type
        switch(currentSearchType) {
            case 'ingredient':
                url = `${API_BASE_URL}/filter.php?i=${encodeURIComponent(query)}`;
                break;
            case 'category':
                url = `${API_BASE_URL}/filter.php?c=${encodeURIComponent(query)}`;
                break;
            case 'name':
                url = `${API_BASE_URL}/search.php?s=${encodeURIComponent(query)}`;
                break;
            default:
                url = `${API_BASE_URL}/filter.php?i=${encodeURIComponent(query)}`;
        }

        // API INTERACTION: Fetch list of cocktails
        const response = await $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json'
        });

        if (!response.drinks || response.drinks.length === 0) {
            showError(`No cocktails found for "${query}"`);
            hideLoading();
            return;
        }

        // Display the list
        displayCocktailsList(response.drinks, query);
        hideLoading();
        
        // Scroll to cocktails section after a short delay to ensure DOM is updated
        setTimeout(function() {
            scrollToCocktails();
        }, 100);
        
    } catch (error) {
        console.error('Error fetching cocktails:', error);
        showError('Failed to fetch cocktails. Please try again.');
        hideLoading();
    }
}

// Fetch All Cocktails - API INTERACTION
async function fetchAllCocktails() {
    hideError();
    showLoading();
    hideCocktails();

    try {
        // Fetch cocktails starting with common letters to get a comprehensive list
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'v', 'w'];
        let allCocktails = [];
        const uniqueCocktailIds = new Set();

        // Fetch cocktails for each letter
        for (const letter of letters) {
            try {
                const response = await $.ajax({
                    url: `${API_BASE_URL}/search.php?f=${letter}`,
                    method: 'GET',
                    dataType: 'json'
                });

                if (response.drinks && response.drinks.length > 0) {
                    // Filter out duplicates by cocktail ID
                    response.drinks.forEach(cocktail => {
                        if (!uniqueCocktailIds.has(cocktail.idDrink)) {
                            uniqueCocktailIds.add(cocktail.idDrink);
                            allCocktails.push(cocktail);
                        }
                    });
                }
            } catch (letterError) {
                // Continue with next letter if one fails
                console.log(`Error fetching cocktails for letter ${letter}:`, letterError);
                continue;
            }
        }

        if (allCocktails.length === 0) {
            showError('No cocktails found. Please try again.');
            hideLoading();
            return;
        }

        // Display all cocktails
        displayCocktailsList(allCocktails, 'all cocktails');
        hideLoading();
        
        // Scroll to cocktails section after DOM is fully updated
        // Use a longer delay to ensure all cocktails are rendered
        setTimeout(function() {
            scrollToCocktails();
        }, 300);
        
    } catch (error) {
        console.error('Error fetching all cocktails:', error);
        showError('Failed to fetch cocktails. Please try again.');
        hideLoading();
    }
}

// Display Cocktails List
function displayCocktailsList(cocktails, query) {
    $('#cocktails-grid').empty();
    
    // Update section title
    if (query === 'all cocktails') {
        $('#section-title').text(`All Cocktails (${cocktails.length})`);
    } else {
        $('#section-title').text(`Found ${cocktails.length} cocktail${cocktails.length !== 1 ? 's' : ''} for "${query}"`);
    }
    
    // Create cards for each cocktail
    cocktails.forEach((cocktail, index) => {
        const card = createCocktailCard(cocktail, index);
        $('#cocktails-grid').append(card);
    });
    
    showCocktails();
    
    // Refresh AOS to animate new elements
    AOS.refresh();
}

// Scroll to cocktails section
function scrollToCocktails() {
    const cocktailsSection = $('#cocktails');
    if (cocktailsSection.length && !cocktailsSection.hasClass('hidden')) {
        // Force a reflow to ensure the section is fully rendered
        cocktailsSection[0].offsetHeight;
        
        $('html, body').animate({
            scrollTop: cocktailsSection.offset().top - 80
        }, 800);
    }
}

// Create Cocktail Card
function createCocktailCard(cocktail, index) {
    const imageUrl = cocktail.strDrinkThumb || 'https://via.placeholder.com/300x300?text=No+Image';
    
    const card = $('<div>')
        .addClass('cocktail-card')
        .attr('data-id', cocktail.idDrink)
        .attr('data-aos', 'fade-up')
        .attr('data-aos-delay', (index % 6) * 50)
        .attr('data-aos-duration', '600')
        .html(`
            <img src="${imageUrl}" alt="${cocktail.strDrink}" class="cocktail-image" loading="lazy">
            <div class="cocktail-info">
                <h3 class="cocktail-name">${cocktail.strDrink}</h3>
                <p class="cocktail-id">ID: ${cocktail.idDrink}</p>
            </div>
        `);
    
    // Add click event to fetch details - API INTERACTION
    card.on('click', function() {
        fetchCocktailDetails(cocktail.idDrink);
    });
    
    return card[0]; // Return DOM element for append
}

// Fetch Cocktail Details - API INTERACTION
async function fetchCocktailDetails(cocktailId) {
    showLoading();
    closeModal();
    
    try {
        // API INTERACTION: Fetch detailed information about selected cocktail
        const data = await $.ajax({
            url: `${API_BASE_URL}/lookup.php?i=${cocktailId}`,
            method: 'GET',
            dataType: 'json'
        });
        
        if (!data.drinks || data.drinks.length === 0) {
            showError('Cocktail details not found');
            hideLoading();
            return;
        }
        
        const cocktail = data.drinks[0];
        displayCocktailDetails(cocktail);
        hideLoading();
        
    } catch (error) {
        console.error('Error fetching cocktail details:', error);
        showError('Failed to fetch cocktail details. Please try again.');
        hideLoading();
    }
}

// Display Cocktail Details in Modal
function displayCocktailDetails(cocktail) {
    // Extract ingredients and measures
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
        const ingredient = cocktail[`strIngredient${i}`];
        const measure = cocktail[`strMeasure${i}`];
        
        if (ingredient) {
            ingredients.push({
                name: ingredient,
                measure: measure || 'To taste'
            });
        }
    }
    
    // Build ingredients list HTML
    const ingredientsHTML = ingredients.map(ing => `
        <li>
            <span class="ingredient-name">${ing.name}</span>
            <span class="ingredient-measure">${ing.measure}</span>
        </li>
    `).join('');
    
    // Build modal content
    $('#modal-body').html(`
        <h2 class="modal-title">${cocktail.strDrink}</h2>
        <div class="modal-image-container">
            <img src="${cocktail.strDrinkThumb || 'https://via.placeholder.com/400x400?text=No+Image'}" 
                 alt="${cocktail.strDrink}" 
                 class="modal-image">
        </div>
        
        <div class="modal-info-row">
            <div class="modal-info-label">Category</div>
            <div class="modal-info-divider"></div>
            <div class="modal-info-value">${cocktail.strCategory || 'Unknown'}</div>
        </div>
        
        <div class="modal-info-row">
            <div class="modal-info-label">Type</div>
            <div class="modal-info-divider"></div>
            <div class="modal-info-value">${cocktail.strAlcoholic || 'Unknown'}</div>
        </div>
        
        <div class="modal-three-columns">
            <div class="modal-column">
                <div class="modal-column-label">Glass</div>
                <div class="modal-column-value">${cocktail.strGlass || 'N/A'}</div>
            </div>
            <div class="modal-column">
                <div class="modal-column-label">Ingredients</div>
                <div class="modal-column-value">${ingredients.length}</div>
            </div>
            <div class="modal-column">
                <div class="modal-column-label">Category</div>
                <div class="modal-column-value">${cocktail.strCategory || 'N/A'}</div>
            </div>
        </div>
        
        <div class="modal-info-row">
            <div class="modal-info-label">Instructions</div>
            <div class="modal-info-divider"></div>
            <div class="modal-info-value">${cocktail.strInstructions || 'No instructions available.'}</div>
        </div>
    `);
    
    // Show modal
    $('#cocktail-modal').removeClass('hidden');
    $('body').css('overflow', 'hidden');
}

// Close Modal
function closeModal() {
    $('#cocktail-modal').addClass('hidden');
    $('body').css('overflow', '');
}

// Utility Functions
function showLoading() {
    $('#loading').removeClass('hidden');
}

function hideLoading() {
    $('#loading').addClass('hidden');
}

function showCocktails() {
    $('#cocktails').removeClass('hidden');
}

function hideCocktails() {
    $('#cocktails').addClass('hidden');
}

function showError(message) {
    $('#error-message').text(message).removeClass('hidden');
}

function hideError() {
    $('#error-message').addClass('hidden');
}

