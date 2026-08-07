const fs = require('fs');
let code = fs.readFileSync('src/components/chat-cards/FoodCard.tsx', 'utf8');
code = code.replace(
`                                     </button>
                                   </div>`,
`                                     </button>
                                     )}
                                   </div>`
);
fs.writeFileSync('src/components/chat-cards/FoodCard.tsx', code);
