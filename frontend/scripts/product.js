/**
 * Product Data Script
 * specific definitions for products displayed on the home page
 */

(function() {
    const products = [
        {
            id: 1,
            name: 'Fresh Tomatoes',
            category: 'vegetables',
            harvestTime: 'harvested',
            price: 5000,
            province: 'Kigali City',
            district: 'Gasabo',
            image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=60',
            description: 'Organic fresh tomatoes directly from the farm.'
        },
        {
            id: 2,
            name: 'Sweet Bananas',
            category: 'fruits',
            harvestTime: 'post-harvest',
            price: 3000,
            province: 'Northern',
            district: 'Musanze',
            image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=500&q=60',
            description: 'Sweet yellow bananas, perfect for dessert.'
        },
        {
            id: 3,
            name: 'Premium Maize',
            category: 'grains',
            harvestTime: 'harvested',
            price: 2000,
            province: 'Eastern',
            district: 'Kayonza',
            image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=500&q=60',
            description: 'High quality dried maize suitable for flour.'
        },
        {
            id: 4,
            name: 'Irish Potatoes',
            category: 'vegetables',
            harvestTime: 'pre-harvest',
            price: 4500,
            province: 'Northern',
            district: 'Musanze',
            image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=60',
            description: 'Kinigi potatoes, known for their great taste.'
        },
        {
            id: 5,
            name: 'Red Beans',
            category: 'grains',
            harvestTime: 'post-harvest',
            price: 1500,
            province: 'Southern',
            district: 'Huye',
            image: 'https://images.unsplash.com/photo-1551465913-b903e1c667d9?auto=format&fit=crop&w=500&q=60',
            description: 'Freshly harvested red beans.'
        },
        {
            id: 6,
            name: 'Carrots',
            category: 'vegetables',
            harvestTime: 'harvested',
            price: 800,
            province: 'Western',
            district: 'Rubavu',
            image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=60',
            description: 'Crunchy and sweet organic carrots.'
        },
        {
            id: 7,
            name: 'Avocado',
            category: 'fruits',
            harvestTime: 'harvested',
            price: 500,
            province: 'Southern',
            district: 'Nyamagabe',
            image: 'https://images.unsplash.com/photo-1523049673856-4287b3385324?auto=format&fit=crop&w=500&q=60',
            description: 'Creamy Hass avocados.'
        },
        {
            id: 8,
            name: 'Rice',
            category: 'grains',
            harvestTime: 'post-harvest',
            price: 12000,
            province: 'Eastern',
            district: 'Bugesera',
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=60',
            description: 'Long grain aromatic rice.'
        }
    ];

    // Expose products to the global window object
    window.getProducts = function() {
        return products;
    };
    
})();