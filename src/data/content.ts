export const introDescription =
  "Escape to Tourmaline House, a uniquely styled retreat moments walk from stunning Pearl Beach. Unwind in the Finnish barrel sauna, cedar ice bath and heated mineral pool, then gather with family and friends around the wood-fired pizza oven, 6-burner BBQ and spacious entertaining deck or fire pit. With a separate self-contained studio, lush tropical gardens and premium amenities throughout, it’s the perfect escape for multiple families or groups to relax, reconnect and recharge.";

export const fullDescription = `Welcome to your private Pearl Beach Wellness Estate!

Perfect for a weekend wellness escape for up to 5 couples, a fitness-focused group adventure, a two-family retreat, or an extended family getaway, this recently renovated premium 5-bedroom residence blends resort-style wellness facilities with high-end, seamless entertaining.

The wellness sanctuary includes a heated mineral swimming pool, traditional electric Finnish barrel sauna, cedar cold plunge available on request, full private gym available on request with a waiver for guests 16+, wood-fired pizza oven, premium 6-burner BBQ, landscaped fire pit and an outdoor shower.

The modern chef’s kitchen is made for grand-scale catering, with a Breville Barista espresso machine, two sinks, a huge peninsula, Zip tap and an entertaining servery opening directly to the outdoor deck.

The main house has three bedrooms and the independent studio adds two more, making room for grandparents, a nanny, or couples seeking extra privacy. Hotel-grade linens and bath towels are included.

The home is powered partly by solar panels, includes a 22kW EV charger with charging windows, an indoor wood heater, secure parking for two large vehicles plus one space out front, and is a short stroll from Pearl Beach and the national park.`;

export const bedrooms = [
  { name: "Bedroom 1 · Master", location: "Main house", bed: "King bed", detail: "Skylit ensuite and built-in robe", image: "/photos/006.jpeg" },
  { name: "Bedroom 2", location: "Main house", bed: "Queen bed", detail: "Lush palm-filled view", image: "/photos/007.jpeg" },
  { name: "Bedroom 3", location: "Main house", bed: "Queen bed + king single", detail: "Large bunk, ideal for a couple and one child", image: "/photos/008.jpeg" },
  { name: "Bedroom 4 · Second master", location: "Separate studio", bed: "King bed", detail: "Direct wellness sanctuary views", image: "/photos/009.jpeg" },
  { name: "Bedroom 5", location: "Separate studio", bed: "King single bunk + queen sofa bed", detail: "95” Samsung TV and memory foam topper", image: "/photos/010.jpeg" },
];

export const highlights = [
  ["Pool", "Heated mineral swimming pool"],
  ["Sauna", "Traditional Finnish barrel sauna"],
  ["Kitchen", "Chef’s kitchen with espresso machine"],
  ["Outdoor", "Pizza oven, BBQ, fire pit and deck"],
  ["EV", "22kW fast EV charger"],
  ["Beach", "Short walk to Pearl Beach and national park"],
];

export const amenityGroups = [
  { name: "Bathroom", items: ["Bath", "Hairdryer", "Cleaning products", "Shampoo", "Conditioner", "Body soap", "Outdoor shower", "Hot water", "Shower gel"] },
  { name: "Bedroom & laundry", items: ["Washing machine", "Free dryer – in unit", "Essentials", "Towels, bed sheets, soap and toilet paper", "Hangers", "Bed linen", "Cotton linen", "Extra pillows and blankets", "Room-darkening blinds", "Iron", "Clothes drying rack", "Wardrobe and chest of drawers"] },
  { name: "Entertainment", items: ["TV", "Record player", "Sound system", "Exercise equipment", "Books and reading material"] },
  { name: "Family", items: ["Children’s books and toys", "Children’s tableware", "Board games"] },
  { name: "Heating and cooling", items: ["Air conditioning", "Indoor fireplace", "Ceiling fan", "Central heating", "Split-system ductless heating"] },
  { name: "Home safety", items: ["Exterior security cameras with guest off-switch", "Smoke alarm", "Carbon monoxide alarm", "Fire extinguisher"] },
  { name: "Internet and office", items: ["Wifi"] },
  { name: "Kitchen and dining", items: ["Full kitchen", "Fisher & Paykel refrigerator", "Microwave", "Cooking basics", "Crockery and cutlery", "Mini fridge", "Freezer", "Dishwasher", "Induction cooker", "Stainless steel oven", "Kettle", "Espresso machine and Nespresso", "Wine glasses", "Toaster", "Baking sheet", "Blender", "Waste compactor", "BBQ utensils", "Dining table", "Coffee"] },
  { name: "Outdoor", items: ["Private patio or balcony", "Fully fenced garden", "Firepit", "Outdoor furniture", "Outdoor dining area", "Outdoor kitchen with sink and oven", "BBQ grill", "Beach essentials", "Sun loungers"] },
  { name: "Parking and facilities", items: ["Free parking on premises", "Free on-street parking", "Pool", "Private sauna", "EV charger – level 2", "Private gym", "Solar panels", "Recycling"] },
  { name: "Services", items: ["Pets allowed", "Self check-in with keypad", "Housekeeping available at extra cost"] },
];

export const flatAmenities = amenityGroups.flatMap((group) => group.items);
