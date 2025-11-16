# TODO: Полнофункциональный интернет-магазин натуральных продуктов

## ОБЩАЯ ИНФОРМАЦИЯ О ПРОЕКТЕ

**Стек технологий:**
- Frontend: React SPA, TypeScript, Tailwind CSS, Shadcn UI, Wouter (роутинг)
- Backend: Node.js, Express.js, TypeScript
- База данных: PostgreSQL + Drizzle ORM
- Файлы: Multer для загрузки изображений
- Аутентификация: JWT + bcrypt
- Email: Nodemailer для верификации
- Платежи: ЮKassa SDK
- Доставка: СДЭК API, Boxberry API
- Управление состоянием: Zustand
- Формы: React Hook Form + Zod
- Запросы: TanStack Query (React Query v5)

**Дизайн-система:**
- Цветовая палитра: зелёный (primary), бежевый, золотой (как на promed.pro)
- Шрифты: Open Sans (основной), serif для заголовков
- Компоненты: Shadcn UI (полностью готовые компоненты)
- Адаптивный дизайн: mobile-first подход

**Роли пользователей:**
1. **Администратор** - полный доступ ко всему (управление пользователями, товарами, заказами, назначение ролей, чат поддержки)
2. **Маркетолог** - управление товарами, категориями, скидками, промокодами, просмотр статистики
3. **Консультант** - доступ только к чату технической поддержки
4. **Покупатель** - обычный пользователь (покупки, личный кабинет, чат поддержки)

**Примечание:** Роли можно совмещать (например, один пользователь может быть и Маркетологом, и Консультантом одновременно)

---

## ФАЗА 1: АРХИТЕКТУРА И СХЕМЫ БД

### 1.1. Определение схем базы данных (shared/schema.ts)

Создать следующие таблицы с использованием Drizzle ORM:

#### Таблица `users` (пользователи)
```typescript
- id: uuid PRIMARY KEY (auto-generated)
- email: text UNIQUE NOT NULL
- password_hash: text NOT NULL (bcrypt хеш)
- first_name: text NOT NULL
- last_name: text (nullable)
- patronymic: text (nullable) // отчество
- phone: text NOT NULL
- is_verified: boolean DEFAULT false
- verification_token: text (nullable)
- verification_token_expires: timestamp (nullable)
- bonus_balance: integer DEFAULT 100 // бонусы
- created_at: timestamp DEFAULT now()
- updated_at: timestamp DEFAULT now()
```

#### Таблица `user_roles` (роли пользователей - many-to-many)
```typescript
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE
- role: text NOT NULL // 'admin' | 'marketer' | 'consultant' | 'customer'
- created_at: timestamp DEFAULT now()

UNIQUE constraint на (user_id, role) // один пользователь не может иметь дублирующиеся роли
INDEX на user_id для быстрого поиска
```

#### Таблица `categories` (категории товаров)
```typescript
- id: uuid PRIMARY KEY
- name: text NOT NULL UNIQUE
- slug: text NOT NULL UNIQUE // для URL
- description: text (nullable)
- sort_order: integer DEFAULT 0 // порядок сортировки
- created_at: timestamp DEFAULT now()
- updated_at: timestamp DEFAULT now()
```

#### Таблица `products` (товары)
```typescript
- id: uuid PRIMARY KEY
- category_id: uuid REFERENCES categories(id) ON DELETE SET NULL
- sku: text UNIQUE NOT NULL // артикул
- name: text NOT NULL
- description: text NOT NULL
- composition: text NOT NULL // состав
- storage_conditions: text NOT NULL // условия хранения
- usage_instructions: text (nullable) // способ применения
- contraindications: text (nullable) // противопоказания
- weight: decimal (nullable) // вес в граммах
- volume: decimal (nullable) // объём в мл
- dimensions_height: decimal (nullable) // высота в см
- dimensions_length: decimal (nullable) // длина в см
- dimensions_width: decimal (nullable) // ширина в см
- shelf_life_days: integer (nullable) // срок годности в днях
- stock_quantity: integer DEFAULT 0 // количество на складе
- price: decimal NOT NULL // цена в рублях
- discount_percentage: decimal DEFAULT 0 // процент скидки (0-100)
- discount_start_date: timestamp (nullable)
- discount_end_date: timestamp (nullable)
- is_new: boolean DEFAULT false // бейдж "Новый"
- is_archived: boolean DEFAULT false // архивный товар (не показывается покупателям)
- rating: decimal DEFAULT 0 // средний рейтинг (0-5)
- reviews_count: integer DEFAULT 0
- view_count: integer DEFAULT 0 // для статистики популярности
- created_at: timestamp DEFAULT now()
- updated_at: timestamp DEFAULT now()

INDEX на category_id, is_archived, price для фильтрации
```

#### Таблица `product_images` (изображения товаров)
```typescript
- id: uuid PRIMARY KEY
- product_id: uuid REFERENCES products(id) ON DELETE CASCADE
- url: text NOT NULL // путь к файлу изображения
- sort_order: integer DEFAULT 0 // порядок в галерее
- created_at: timestamp DEFAULT now()

INDEX на product_id
```

#### Таблица `user_addresses` (адреса доставки пользователей)
```typescript
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE
- label: text NOT NULL // название ("Дом", "Работа" и т.д.)
- full_address: text NOT NULL // полный адрес строкой
- city: text NOT NULL
- street: text NOT NULL
- building: text NOT NULL // дом
- apartment: text (nullable) // квартира
- postal_code: text NOT NULL
- is_default: boolean DEFAULT false
- created_at: timestamp DEFAULT now()

INDEX на user_id
```

#### Таблица `user_payment_cards` (сохранённые карты пользователей)
```typescript
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE
- yukassa_payment_token: text NOT NULL // токен от ЮKassa
- card_last_four: text NOT NULL // последние 4 цифры
- card_type: text NOT NULL // Visa, MasterCard и т.д.
- is_default: boolean DEFAULT false
- created_at: timestamp DEFAULT now()

INDEX на user_id
```

#### Таблица `promocodes` (промокоды)
```typescript
- id: uuid PRIMARY KEY
- code: text UNIQUE NOT NULL // сам промокод (например, "SALE20")
- discount_percentage: decimal NOT NULL // процент скидки (0-100)
- min_order_amount: decimal DEFAULT 0 // минимальная сумма заказа (0 = без ограничений)
- max_order_amount: decimal (nullable) // максимальная сумма заказа (null = без ограничений)
- type: text NOT NULL // 'single_use' | 'temporary'
- expires_at: timestamp (nullable) // для временных промокодов
- is_active: boolean DEFAULT true
- created_at: timestamp DEFAULT now()
- created_by_user_id: uuid REFERENCES users(id) ON DELETE SET NULL

INDEX на code, type, is_active
```

#### Таблица `promocode_usage` (использование промокодов)
```typescript
- id: uuid PRIMARY KEY
- promocode_id: uuid REFERENCES promocodes(id) ON DELETE CASCADE
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE
- order_id: uuid REFERENCES orders(id) ON DELETE CASCADE
- used_at: timestamp DEFAULT now()

UNIQUE constraint на (promocode_id, user_id) для временных промокодов
INDEX на promocode_id, user_id
```

#### Таблица `orders` (заказы)
```typescript
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) ON DELETE SET NULL
- order_number: text UNIQUE NOT NULL // номер заказа (автогенерируемый)
- status: text NOT NULL // 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
-
// Товары
- items: jsonb NOT NULL // массив {product_id, name, price, quantity, discount}
- subtotal: decimal NOT NULL // сумма товаров
- discount_amount: decimal DEFAULT 0
- bonuses_used: decimal DEFAULT 0
- bonuses_earned: decimal DEFAULT 0
- promocode_id: uuid REFERENCES promocodes(id) ON DELETE SET NULL
-
// Доставка
- delivery_service: text NOT NULL // 'cdek' | 'boxberry'
- delivery_type: text NOT NULL // 'pvz' | 'postamat' | 'courier'
- delivery_point_code: text (nullable) // код ПВЗ/постамата
- delivery_address: jsonb (nullable) // для курьерской доставки
- delivery_cost: decimal NOT NULL
- delivery_tracking_number: text (nullable)
-
// Оплата
- payment_method: text NOT NULL // 'online' | 'on_delivery'
- payment_status: text NOT NULL // 'pending' | 'paid' | 'failed'
- yukassa_payment_id: text (nullable)
-
// Итого
- total: decimal NOT NULL
-
// Временные метки
- paid_at: timestamp (nullable)
- shipped_at: timestamp (nullable)
- delivered_at: timestamp (nullable)
- completed_at: timestamp (nullable)
- created_at: timestamp DEFAULT now()
- updated_at: timestamp DEFAULT now()

INDEX на user_id, status, created_at
```

#### Таблица `cart_items` (корзина - привязана к аккаунту)
```typescript
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE
- product_id: uuid REFERENCES products(id) ON DELETE CASCADE
- quantity: integer NOT NULL
- added_at: timestamp DEFAULT now()
- updated_at: timestamp DEFAULT now()

UNIQUE constraint на (user_id, product_id)
INDEX на user_id
```

#### Таблица `wishlist_items` (избранное)
```typescript
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE
- product_id: uuid REFERENCES products(id) ON DELETE CASCADE
- added_at: timestamp DEFAULT now()

UNIQUE constraint на (user_id, product_id)
INDEX на user_id
```

#### Таблица `comparison_items` (сравнение товаров)
```typescript
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE
- product_id: uuid REFERENCES products(id) ON DELETE CASCADE
- added_at: timestamp DEFAULT now()

UNIQUE constraint на (user_id, product_id)
INDEX на user_id
```

#### Таблица `support_messages` (чат поддержки)
```typescript
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) ON DELETE CASCADE // клиент
- sender_id: uuid REFERENCES users(id) ON DELETE SET NULL // отправитель (клиент или консультант)
- message_text: text (nullable) // текст сообщения
- is_read: boolean DEFAULT false // прочитано консультантом
- created_at: timestamp DEFAULT now()

INDEX на user_id, created_at
```

#### Таблица `support_message_attachments` (вложения в чате)
```typescript
- id: uuid PRIMARY KEY
- message_id: uuid REFERENCES support_messages(id) ON DELETE CASCADE
- file_url: text NOT NULL // путь к файлу
- file_size: integer NOT NULL // размер в байтах
- file_type: text NOT NULL // MIME type
- created_at: timestamp DEFAULT now()

INDEX на message_id
```

### 1.2. Определение Zod схем и TypeScript типов

Для каждой таблицы создать:
- `createInsertSchema` (Drizzle Zod) с `.omit()` для авто-генерируемых полей
- `type InsertXxx = z.infer<typeof insertXxxSchema>`
- `type Xxx = typeof xxxTable.$inferSelect`

Дополнительные схемы валидации:
- Регистрация: email + пароль (мин 8 символов) + имя + телефон (+ опц. фамилия, отчество)
- Вход: email + пароль
- Создание товара: все обязательные поля + массив изображений
- Создание заказа: адрес, способ доставки, способ оплаты
- Промокод: валидация формата кода (только буквы и цифры, 4-20 символов)

---

## ФАЗА 2: BACKEND (API)

### 2.1. Настройка базы данных и миграций

1. Создать `server/db.ts` по примеру из blueprint javascript_database
2. Обновить `server/storage.ts` - заменить MemStorage на DatabaseStorage
3. Выполнить `npm run db:push` для создания таблиц

### 2.2. Middleware и утилиты

#### 2.2.1. Аутентификация (server/auth.ts)
```typescript
// JWT токены
- generateToken(userId: string, expiresIn: string): string
- verifyToken(token: string): { userId: string } | null

// Password hashing
- hashPassword(password: string): Promise<string>
- comparePassword(password: string, hash: string): Promise<boolean>

// Middleware
- authenticateToken(req, res, next) // проверка JWT в заголовке Authorization
- requireRole(...roles: string[]) // проверка наличия хотя бы одной из ролей
```

#### 2.2.2. Email (server/email.ts)
```typescript
// Nodemailer setup
- createTransporter() // конфигурация SMTP

// Email templates
- sendVerificationEmail(email: string, token: string, firstName: string)
  Шаблон: "Здравствуйте, {firstName}! Подтвердите email, перейдя по ссылке: {siteUrl}/verify-email?token={token}"

// Utility
- generateVerificationToken(): string // случайная строка 32 символа
```

#### 2.2.3. Файлы (server/upload.ts)
```typescript
// Multer setup для загрузки изображений
- productImagesUpload = multer({
    storage: diskStorage({
      destination: 'uploads/products',
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${randomUUID()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 МБ
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Недопустимый формат файла'));
      }
    }
  })

- chatAttachmentsUpload = multer({
    storage: diskStorage({
      destination: 'uploads/chat',
      filename: аналогично
    }),
    limits: { 
      fileSize: 10 * 1024 * 1024, // каждый файл до 10 МБ
      files: 7 // максимум 7 файлов за раз
    },
    fileFilter: аналогично
  })

// Middleware для проверки суммарного размера вложений
- validateTotalFileSize(maxTotalSize: number) // проверка, что сумма файлов <= 40 МБ
```

#### 2.2.4. Бонусная система (server/bonuses.ts)
```typescript
// Расчёт кешбэка
- calculateCashback(orderAmount: number, usedBonuses: boolean, usedPromocode: boolean): number
  Логика:
  - Если usedBonuses или usedPromocode === true → return 0
  - Если 0 <= orderAmount < 1000 → 3%
  - Если 1000 <= orderAmount < 2500 → 5%
  - Если 2500 <= orderAmount < 10000 → 7%
  - Если orderAmount >= 10000 → 10%

- canUseBonuses(bonusBalance: number, orderSubtotal: number): { maxUsable: number, twentyPercent: number }
  Логика:
  - Максимум можно использовать 20% от суммы заказа
  - twentyPercent = Math.floor(orderSubtotal * 0.2)
  - maxUsable = Math.min(bonusBalance, twentyPercent)
```

#### 2.2.5. Промокоды (server/promocodes.ts)
```typescript
- validatePromocode(code: string, userId: string, orderAmount: number): Promise<{
    valid: boolean,
    promocode?: Promocode,
    error?: string,
    discountAmount?: number
  }>
  Логика:
  1. Найти промокод по коду (регистронезависимо)
  2. Проверить is_active
  3. Проверить expires_at (если есть)
  4. Проверить min_order_amount и max_order_amount
  5. Если тип 'temporary' - проверить, использовал ли уже этот пользователь (таблица promocode_usage)
  6. Рассчитать скидку = orderAmount * (discount_percentage / 100)
  7. Вернуть результат

- applyPromocode(promocodeId: string, userId: string, orderId: string): Promise<void>
  Логика:
  - Если тип 'single_use' - удалить промокод из таблицы promocodes
  - Если тип 'temporary' - добавить запись в promocode_usage
```

### 2.3. API Routes (server/routes.ts)

Все маршруты с префиксом `/api`

#### 2.3.1. Аутентификация и пользователи

**POST /api/auth/register**
- Body: { email, password, firstName, lastName?, patronymic?, phone }
- Валидация: Zod schema
- Логика:
  1. Проверить, что email уникальный
  2. Хешировать пароль (bcrypt)
  3. Сгенерировать verification_token
  4. Установить verification_token_expires = now + 24 часа
  5. Создать пользователя с is_verified = false, bonus_balance = 100
  6. Создать роль 'customer' в user_roles
  7. Отправить письмо с verification_token
  8. Вернуть { success: true, message: 'Проверьте почту для подтверждения' }

**GET /api/auth/verify-email?token=xxx**
- Логика:
  1. Найти пользователя по verification_token
  2. Проверить, что токен не истёк
  3. Установить is_verified = true, verification_token = null, verification_token_expires = null
  4. Вернуть { success: true }

**POST /api/auth/login**
- Body: { email, password }
- Логика:
  1. Найти пользователя по email
  2. Проверить, что is_verified = true
  3. Сравнить пароль (bcrypt.compare)
  4. Если совпадает - сгенерировать JWT токен
  5. Загрузить роли пользователя из user_roles
  6. Вернуть { token, user: { id, email, firstName, roles: [...] } }

**GET /api/auth/me** (требует аутентификации)
- Вернуть данные текущего пользователя + его роли

**PATCH /api/users/profile** (требует аутентификации)
- Body: { firstName?, lastName?, patronymic?, phone? }
- Обновить профиль текущего пользователя

**PATCH /api/users/password** (требует аутентификации)
- Body: { currentPassword, newPassword }
- Проверить текущий пароль и обновить на новый

#### 2.3.2. Адреса доставки

**GET /api/users/addresses** (требует аутентификации)
- Вернуть все адреса текущего пользователя

**POST /api/users/addresses** (требует аутентификации)
- Body: { label, fullAddress, city, street, building, apartment?, postalCode, isDefault? }
- Создать новый адрес
- Если isDefault = true, снять флаг с других адресов

**PATCH /api/users/addresses/:id** (требует аутентификации)
- Обновить адрес (проверка, что адрес принадлежит пользователю)

**DELETE /api/users/addresses/:id** (требует аутентификации)
- Удалить адрес (проверка владения)

#### 2.3.3. Платёжные карты

**GET /api/users/cards** (требует аутентификации)
- Вернуть сохранённые карты пользователя (только card_last_four, card_type)

**POST /api/users/cards** (требует аутентификации)
- Body: { yukassaPaymentToken, cardLastFour, cardType, isDefault? }
- Сохранить токенизированную карту от ЮKassa

**DELETE /api/users/cards/:id** (требует аутентификации)
- Удалить карту

#### 2.3.4. Категории

**GET /api/categories**
- Вернуть все категории (сортировка по sort_order)

**POST /api/categories** (требует роль: admin или marketer)
- Body: { name, slug, description?, sortOrder? }
- Создать категорию

**PATCH /api/categories/:id** (требует роль: admin или marketer)
- Обновить категорию

**DELETE /api/categories/:id** (требует роль: admin или marketer)
- Удалить категорию (если нет привязанных товаров)

#### 2.3.5. Товары

**GET /api/products**
- Query params: 
  - categoryId?: string
  - minPrice?: number
  - maxPrice?: number
  - search?: string (поиск по названию)
  - sortBy?: 'price_asc' | 'price_desc' | 'popularity' | 'newest' | 'rating'
  - page?: number
  - limit?: number (default 30)
- Логика:
  - Фильтровать по is_archived = false (для обычных пользователей)
  - Применить фильтры
  - Сортировка:
    - popularity: ORDER BY view_count DESC
    - newest: ORDER BY created_at DESC
    - rating: ORDER BY rating DESC
  - Пагинация
- Вернуть { products: [...], total, page, totalPages }

**GET /api/products/:id**
- Вернуть товар со всеми изображениями (JOIN product_images)
- Увеличить view_count на 1
- Если is_archived = true - доступно только admin/marketer

**POST /api/products** (требует роль: admin или marketer)
- Body: FormData с полями товара + массив изображений
- Multer: productImagesUpload.array('images')
- Логика:
  1. Создать товар
  2. Для каждого загруженного файла создать запись в product_images
  3. Вернуть созданный товар

**PATCH /api/products/:id** (требует роль: admin или marketer)
- Body: FormData с обновляемыми полями + опционально новые изображения
- Обновить товар
- Если есть новые изображения - добавить в product_images

**DELETE /api/products/images/:imageId** (требует роль: admin или marketer)
- Удалить изображение товара (и файл с диска)

**PATCH /api/products/:id/archive** (требует роль: admin или marketer)
- Body: { isArchived: boolean }
- Переместить товар в архив или восстановить

**PATCH /api/products/:id/discount** (требует роль: admin или marketer)
- Body: { discountPercentage, discountStartDate?, discountEndDate? }
- Установить скидку на товар

#### 2.3.6. Корзина

**GET /api/cart** (требует аутентификации)
- Вернуть товары в корзине текущего пользователя (JOIN products)
- Для каждого товара: product info, quantity, subtotal

**POST /api/cart** (требует аутентификации)
- Body: { productId, quantity }
- Логика:
  - Если товар уже в корзине - обновить quantity
  - Иначе создать новую запись
  - Проверить stock_quantity товара

**PATCH /api/cart/:productId** (требует аутентификации)
- Body: { quantity }
- Обновить количество товара в корзине

**DELETE /api/cart/:productId** (требует аутентификации)
- Удалить товар из корзины

**DELETE /api/cart** (требует аутентификации)
- Очистить всю корзину

#### 2.3.7. Избранное и сравнение

**GET /api/wishlist** (требует аутентификации)
- Вернуть избранные товары

**POST /api/wishlist** (требует аутентификации)
- Body: { productId }
- Добавить товар в избранное

**DELETE /api/wishlist/:productId** (требует аутентификации)
- Удалить из избранного

**GET /api/comparison** (требует аутентификации)
- Вернуть товары для сравнения

**POST /api/comparison** (требует аутентификации)
- Body: { productId }
- Добавить товар в сравнение

**DELETE /api/comparison/:productId** (требует аутентификации)
- Удалить из сравнения

#### 2.3.8. Промокоды

**POST /api/promocodes/validate** (требует аутентификации)
- Body: { code, orderAmount }
- Использовать функцию validatePromocode()
- Вернуть { valid, discountAmount?, error? }

**GET /api/promocodes** (требует роль: admin или marketer)
- Вернуть все промокоды

**POST /api/promocodes** (требует роль: admin или marketer)
- Body: { code, discountPercentage, minOrderAmount?, maxOrderAmount?, type, expiresAt? }
- Создать промокод

**PATCH /api/promocodes/:id** (требует роль: admin или marketer)
- Обновить промокод

**DELETE /api/promocodes/:id** (требует роль: admin)
- Удалить промокод

#### 2.3.9. Доставка (интеграция СДЭК и Boxberry)

**POST /api/delivery/calculate**
- Body: { 
    service: 'cdek' | 'boxberry',
    deliveryType: 'pvz' | 'postamat' | 'courier',
    address?: { city, street, building },
    pointCode?: string,
    weight: number, // общий вес товаров
    dimensions: { length, width, height } // общие размеры
  }
- Логика:
  - Вызвать API СДЭК или Boxberry для расчёта стоимости
  - Вернуть { cost, estimatedDays }

**GET /api/delivery/points**
- Query: { service: 'cdek' | 'boxberry', city: string, type?: 'pvz' | 'postamat' }
- Вернуть список ПВЗ/постаматов в городе (из API)

#### 2.3.10. Заказы

**GET /api/orders** (требует аутентификации)
- Query: { status?: 'active' | 'history' }
- Логика:
  - active: статусы pending, paid, shipped, delivered
  - history: все заказы
- Вернуть заказы текущего пользователя

**GET /api/orders/:id** (требует аутентификации)
- Вернуть детали заказа (проверка владения)

**POST /api/orders** (требует аутентификации)
- Body: {
    items: [{ productId, quantity }],
    deliveryService, deliveryType, deliveryPointCode?, deliveryAddress?,
    paymentMethod,
    promocodeId?, bonusesToUse?,
    savedCardId? // если оплата картой
  }
- Логика:
  1. Валидация товаров и остатков
  2. Расчёт subtotal
  3. Применить промокод (если есть)
  4. Применить бонусы (если есть, max 20%)
  5. Проверить, что бонусы и промокод не применяются одновременно со скидками
  6. Расчёт delivery_cost через API доставки
  7. Расчёт total
  8. Если paymentMethod = 'on_delivery' и total > 3000 - вернуть ошибку
  9. Создать заказ со статусом 'pending'
  10. Если paymentMethod = 'online':
     - Создать платёж через ЮKassa API
     - Вернуть { orderId, paymentUrl } для редиректа
  11. Если paymentMethod = 'on_delivery':
     - Установить статус 'paid', оплата произойдёт при получении
     - Очистить корзину
     - Уменьшить stock_quantity товаров
     - Применить промокод (applyPromocode)
     - Вернуть { orderId, success: true }

**POST /api/orders/:id/payment-callback** (webhook от ЮKassa)
- Body: данные от ЮKassa о статусе платежа
- Логика:
  1. Проверить подпись (security)
  2. Если платёж успешен:
     - Обновить статус заказа на 'paid'
     - Установить paid_at = now
     - Очистить корзину пользователя
     - Уменьшить stock_quantity товаров
     - Применить промокод
     - Начислить бонусы (если не использовались бонусы/промокод)
  3. Если платёж не прошёл - статус 'cancelled'

**GET /api/admin/orders** (требует роль: admin)
- Query: { status?, page?, limit? }
- Вернуть все заказы с пагинацией

**PATCH /api/admin/orders/:id/status** (требует роль: admin)
- Body: { status }
- Обновить статус заказа вручную

#### 2.3.11. Чат поддержки

**GET /api/support/messages** (требует аутентификации)
- Для Покупателя: вернуть все его сообщения
- Для Консультанта/Админа: вернуть все диалоги всех пользователей

**POST /api/support/messages** (требует аутентификации)
- Body: FormData { messageText?, attachments[] }
- Multer: chatAttachmentsUpload.array('attachments', 7)
- Логика:
  1. Проверить размер файлов (суммарно max 40 МБ)
  2. Создать сообщение
  3. Для каждого файла создать support_message_attachments
  4. Вернуть созданное сообщение

**PATCH /api/support/messages/:id/read** (требует роль: consultant или admin)
- Пометить сообщение как прочитанное

**GET /api/support/customer-info/:userId** (требует роль: consultant или admin)
- Вернуть информацию о клиенте: { firstName, email, phone, orderHistory[] }

#### 2.3.12. Управление пользователями (админ)

**GET /api/admin/users** (требует роль: admin)
- Query: { search?, page?, limit? }
- Вернуть всех пользователей с их ролями

**PATCH /api/admin/users/:id/roles** (требует роль: admin)
- Body: { roles: string[] } // массив ролей
- Логика:
  1. Удалить все текущие роли пользователя
  2. Добавить новые роли из массива

**DELETE /api/admin/users/:id** (требует роль: admin)
- Удалить пользователя (soft delete или hard delete - решить)

#### 2.3.13. Статистика (админ и маркетолог)

**GET /api/statistics/revenue** (требует роль: admin или marketer)
- Query: { period: 'day' | 'week' | 'month' | 'all' }
- Вернуть общую выручку за период

**GET /api/statistics/products** (требует роль: admin или marketer)
- Вернуть статистику по товарам:
  - total revenue per product (поартикульная выручка)
  - количество продаж
  - сортировка по популярности

**GET /api/statistics/orders** (требует роль: admin или marketer)
- Query: { period: 'day' | 'week' | 'month' | 'all' }
- Вернуть количество заказов за период

**GET /api/statistics/chart** (требует роль: admin или marketer)
- Query: { period: 'week' | 'month' | 'year' }
- Вернуть данные для графика продаж по времени (массив {date, revenue, orders})

### 2.4. WebSocket для чата (реальное время)

**Настройка WebSocket сервера:**
- В `server/routes.ts` добавить WebSocket сервер на пути `/ws`
- Использовать библиотеку `ws`

**Логика:**
1. При подключении клиента - аутентифицировать по JWT токену
2. Сохранять соединения в Map<userId, WebSocket>
3. При отправке сообщения через POST /api/support/messages:
   - Отправить WebSocket событие всем подключённым консультантам/админам
   - Если отправитель - консультант, отправить событие клиенту
4. События:
   - `new_message`: { messageId, userId, senderId, messageText, attachments, createdAt }
   - `message_read`: { messageId }

### 2.5. Автоматическое обновление статусов заказов

**Создать cron job или scheduled task:**
- Каждые 15 минут проверять заказы со статусом 'shipped'
- Для каждого заказа запрашивать статус доставки через API СДЭК/Boxberry
- Если статус = "В пункте выдачи" или "Доставлено" → обновить на 'delivered', установить delivered_at
- Если пользователь забрал (информация от службы доставки) → статус 'completed', установить completed_at

**Библиотека:** node-cron

---

## ФАЗА 3: FRONTEND

### 3.1. Настройка дизайн-системы

#### 3.1.1. Обновить client/src/index.css
- Цветовая палитра:
  - `--primary`: 145 65% 35% (зелёный)
  - `--background`: 40 8% 98% (бежевый светлый)
  - `--accent`: 45 100% 50% (золотой)
  - Остальные цвета адаптировать под природную палитру
- Шрифты:
  - `--font-sans`: 'Open Sans', sans-serif
  - `--font-serif`: 'Playfair Display', serif (для заголовков)

#### 3.1.2. Обновить client/index.html
- Подключить Google Fonts: Open Sans (400, 500, 600, 700), Playfair Display (400, 600, 700)

#### 3.1.3. Обновить tailwind.config.ts
- Настроить fontFamily
- Настроить цвета согласно дизайну

### 3.2. Общие компоненты

#### 3.2.1. Layout компоненты (client/src/components/layout/)

**Header.tsx**
- Логотип (слева)
- Поиск (центр, большой)
- Иконки: Аккаунт, Избранное, Сравнение, Корзина (справа)
- Корзина с бейджем количества товаров
- Sticky позиционирование

**Navigation.tsx**
- Список категорий (горизонтальное меню)
- Hover эффект

**MobileNav.tsx**
- Hamburger меню
- Drawer с категориями и ссылками
- Bottom tab bar для ключевых функций (Главная, Каталог, Корзина, Профиль)

**Footer.tsx**
- Multi-column layout
- Ссылки на страницы, контакты, соцсети
- Copyright

**Sidebar.tsx** (для админ-панели)
- Используйте Shadcn Sidebar компонент
- Меню в зависимости от роли:
  - Admin: Дашборд, Пользователи, Товары, Категории, Заказы, Промокоды, Статистика, Чат
  - Marketer: Дашборд, Товары, Категории, Промокоды, Статистика
  - Consultant: Чат

#### 3.2.2. UI компоненты (client/src/components/ui/)

Все компоненты Shadcn уже установлены. Дополнительно создать:

**ProductCard.tsx**
- Props: product (Product type)
- Изображение (aspect-ratio 3:4 или 1:1)
- Бейдж "Новый" (если is_new = true)
- Название (2 строки, truncate)
- Рейтинг (звёзды) + количество отзывов
- Цена (большая, жирная), зачёркнутая старая цена если скидка
- Иконки: избранное, сравнение, быстрый просмотр (на hover)
- Кнопка "В корзину" (на hover desktop, всегда видна mobile)

**EmptyState.tsx**
- Props: icon, title, description, action?
- Для пустых состояний (пустая корзина, нет товаров и т.д.)

**LoadingSkeleton.tsx**
- Skeleton для ProductCard, таблиц, профиля и т.д.

**ImageGallery.tsx**
- Props: images: string[]
- Большое изображение + ряд миниатюр снизу
- Zoom на клик (modal с увеличенным изображением)

**StatusBadge.tsx**
- Props: status (order status)
- Отображение статуса заказа цветным бейджем

### 3.3. Страницы для покупателей

#### 3.3.1. Главная страница (client/src/pages/Home.tsx)

**Hero Section:**
- Полноэкранный баннер (60-70vh)
- Фоновое изображение (натуральные продукты, мёд, природа)
- Overlay с градиентом
- Заголовок: "Натуральные продукты для здоровья"
- Подзаголовок: "Мёд, бальзамы и напитки на основе природных ингредиентов"
- CTA кнопка: "Перейти в каталог"

**Категории:**
- Grid 3-4 колонки
- Карточки категорий с изображениями
- Hover эффект

**Популярные товары:**
- Grid 4 колонки (ProductCard)
- Заголовок "Популярные товары"
- Кнопка "Смотреть все" → каталог с сортировкой по популярности

**Преимущества:**
- 3 колонки
- Иконки + текст (Натуральные ингредиенты, Доставка по РФ, Безопасная оплата)

**Newsletter / Подписка на новости:**
- Форма с email input + кнопка "Подписаться"

#### 3.3.2. Каталог товаров (client/src/pages/Catalog.tsx)

**Layout:**
- Sidebar слева (desktop) / Drawer (mobile)
- Фильтры:
  - Категории (чекбоксы)
  - Цена (slider диапазон)
  - Кнопка "Сбросить фильтры"
- Toolbar:
  - Количество результатов
  - Сортировка (dropdown): По умолчанию, По возрастанию цены, По убыванию цены, По популярности, По новизне, По рейтингу
- Product Grid (3-4 колонки, ProductCard)
- Pagination внизу

**Состояния:**
- Loading: Skeleton
- Empty: EmptyState "Товары не найдены"

#### 3.3.3. Страница товара (client/src/pages/ProductDetail.tsx)

**Layout 2 колонки:**

**Левая колонка:**
- ImageGallery (большое фото + миниатюры)

**Правая колонка:**
- Название товара (H1)
- Рейтинг + количество отзывов
- Цена (большая), зачёркнутая старая цена если скидка
- Бейдж "Новый" если is_new
- Статус наличия: "В наличии" (зелёный) / "Мало на складе" (жёлтый) / "Нет в наличии" (серый)
- Quantity selector (+ / - кнопки, input)
- Кнопка "Добавить в корзину" (большая, primary)
- Иконки: Избранное, Сравнение

**Tabs (полная ширина):**
- Описание
- Состав
- Условия хранения
- Способ применения (если заполнено)
- Противопоказания (если заполнено)

**Похожие товары:**
- Grid 4 колонки (ProductCard)

#### 3.3.4. Корзина (client/src/pages/Cart.tsx)

**Layout 2 колонки (desktop):**

**Левая колонка (2/3 ширины):**
- Таблица/список товаров:
  - Миниатюра
  - Название (ссылка на товар)
  - Цена за единицу
  - Quantity selector
  - Subtotal
  - Кнопка удалить
- Если корзина пустая - EmptyState

**Правая колонка (1/3 ширины, sticky):**
- Заголовок "Итого"
- Subtotal
- Поле ввода промокода (input + кнопка "Применить")
- Или поле "Использовать бонусы" (input количество + max доступно)
- Скидка (если применён промокод или бонусы)
- Доставка: "Рассчитается при оформлении"
- Total (жирный, большой)
- Кнопка "Оформить заказ" (primary, большая)

**Mobile:** Stack вертикально

#### 3.3.5. Оформление заказа (client/src/pages/Checkout.tsx)

**Multi-step форма с визуальным индикатором прогресса:**

**Шаг 1: Контактные данные**
- Если пользователь авторизован - предзаполнить из профиля
- Поля: Имя, Фамилия, Телефон, Email

**Шаг 2: Доставка**
- Выбор службы доставки (radio): СДЭК, Boxberry
- Выбор типа (radio): ПВЗ, Постамат, Курьер
- Если ПВЗ/Постамат:
  - Поле выбора города (autocomplete)
  - Dropdown со списком точек (загрузить через API)
- Если Курьер:
  - Выбор сохранённого адреса (если есть) или кнопка "Добавить новый адрес"
  - Форма адреса (город, улица, дом, квартира, индекс)
- Расчёт стоимости доставки (показать cost + estimatedDays)

**Шаг 3: Оплата**
- Выбор способа оплаты (radio):
  - Онлайн (ЮKassa)
  - При получении (если сумма заказа < 3000)
- Если онлайн:
  - Выбор сохранённой карты или новая карта
  - Чекбокс "Сохранить карту для будущих покупок"

**Шаг 4: Подтверждение**
- Сводка заказа:
  - Список товаров
  - Контактная информация
  - Адрес доставки
  - Способ оплаты
  - Итоговая сумма
- Кнопка "Оформить заказ"

**Sidebar (sticky):**
- Итого по заказу (subtotal, скидка, доставка, total)

**После оформления:**
- Если оплата онлайн - редирект на ЮKassa
- Если при получении - переход на страницу "Заказ оформлен" с номером заказа

#### 3.3.6. Личный кабинет (client/src/pages/Profile.tsx)

**Sidebar навигация (слева):**
- Личная информация
- Адреса доставки
- Способы оплаты
- Заказы
- Бонусы

**Content area (справа):**

**Личная информация:**
- Форма с полями: Имя, Фамилия, Отчество, Телефон, Email (readonly)
- Кнопка "Сохранить"
- Кнопка "Изменить пароль" → modal с формой (старый пароль, новый пароль)

**Адреса доставки:**
- Список сохранённых адресов (Card компоненты)
- Кнопка "Добавить адрес" → modal с формой
- Каждый адрес: label, полный адрес, кнопки "Редактировать", "Удалить", бейдж "По умолчанию"

**Способы оплаты:**
- Список сохранённых карт (Card компоненты)
- Для каждой карты: тип карты, последние 4 цифры, кнопка "Удалить", бейдж "По умолчанию"
- Примечание: "Для добавления новой карты совершите покупку"

**Заказы:**
- Две вкладки (Tabs):
  - **Активные доставки** (статусы: pending, paid, shipped, delivered)
  - **История заказов** (все заказы)
- Для каждого заказа (Card):
  - Номер заказа, дата
  - Список товаров (миниатюры + названия)
  - Статус (StatusBadge)
  - Сумма
  - Начисленные бонусы (если есть)
  - Кнопка "Детали" → modal с полной информацией

**Бонусы:**
- Текущий баланс бонусов (большое число)
- Информация о программе лояльности (как начисляются, как использовать)
- История начислений (таблица: дата, заказ, сумма начисления)

#### 3.3.7. Избранное (client/src/pages/Wishlist.tsx)

- Grid товаров (ProductCard)
- Если пусто - EmptyState

#### 3.3.8. Сравнение (client/src/pages/Comparison.tsx)

- Таблица сравнения товаров (горизонтальный scroll на mobile)
- Характеристики в строках, товары в колонках
- Кнопка "Удалить из сравнения" для каждого товара

#### 3.3.9. Виджет чата поддержки (client/src/components/SupportChat.tsx)

**Состояния:**
- Свёрнутый: Floating button (bottom-right), иконка чата + бейдж с непрочитанными
- Развёрнутый: Panel 400px × 600px

**Развёрнутый вид:**
- Header: "Техническая поддержка", кнопки минимизировать/закрыть
- Messages area: Список сообщений (scroll)
  - Сообщения пользователя (справа, голубой фон)
  - Сообщения консультанта (слева, серый фон)
  - Время отправки
  - Вложения (превью изображений, клик для просмотра)
- Input area:
  - Textarea для ввода текста
  - Кнопка прикрепить файл (input type="file", multiple, accept="image/*")
  - Индикатор: "Загружено X/7 файлов, Y MB / 40 MB"
  - Кнопка "Отправить"

**WebSocket:**
- Подключение при открытии чата
- Автоматическое добавление новых сообщений в список
- Звуковое уведомление при получении сообщения от консультанта

### 3.4. Админ-панель и панель маркетолога

#### 3.4.1. Layout (client/src/pages/admin/Layout.tsx)

- Shadcn Sidebar (слева)
- Header (справа) с именем пользователя и кнопкой выйти
- Main content area

#### 3.4.2. Дашборд (client/src/pages/admin/Dashboard.tsx)

**Stat Cards (grid 2-4 колонки):**
- Общая выручка (с выбором периода: день/неделя/месяц/всё время)
- Количество заказов (за выбранный период)
- Новых пользователей (за выбранный период)
- Средний чек

**График продаж:**
- Линейный график (Recharts)
- Ось X: время (дни/недели/месяцы)
- Ось Y: выручка
- Выбор периода: неделя/месяц/год

**Топ товаров:**
- Таблица (5-10 товаров)
- Колонки: Название, Продаж, Выручка
- Сортировка по выручке

#### 3.4.3. Управление пользователями (client/src/pages/admin/Users.tsx) - только Admin

**Toolbar:**
- Поиск по email/имени
- Кнопка "Добавить пользователя" (опционально)

**Таблица:**
- Колонки: Email, Имя, Роли, Дата регистрации, Действия
- Для каждого пользователя кнопка "Редактировать роли"
  - Modal с чекбоксами ролей (admin, marketer, consultant, customer)
  - Кнопка "Сохранить"
- Кнопка "Удалить" (с подтверждением)

**Pagination:**
- Внизу таблицы

#### 3.4.4. Управление товарами (client/src/pages/admin/Products.tsx) - Admin и Marketer

**Toolbar:**
- Поиск по названию/артикулу
- Фильтр по категории
- Фильтр "Показать архивные"
- Кнопка "Добавить товар"

**Таблица:**
- Колонки: Миниатюра, Название, Артикул, Категория, Цена, Скидка, Остаток, Статус, Действия
- Действия: Редактировать, Архивировать/Восстановить, Удалить (только Admin)

**Форма добавления/редактирования товара (Modal или отдельная страница):**
- Поля:
  - Категория (dropdown)
  - Артикул
  - Название
  - Описание (textarea)
  - Состав (textarea)
  - Условия хранения (textarea)
  - Способ применения (textarea, опц)
  - Противопоказания (textarea, опц)
  - Вес, Объём, Размеры (В×Д×Ш)
  - Срок годности (дни)
  - Цена
  - Количество на складе
  - Чекбокс "Новый товар"
  - Загрузка изображений (drag-and-drop zone, multiple)
    - Превью загруженных изображений (grid)
    - Кнопка удалить для каждого
    - Drag-and-drop для изменения порядка
- Секция "Скидка":
  - Процент скидки
  - Дата начала (date picker)
  - Дата окончания (date picker)
- Кнопки: "Сохранить", "Отмена"

#### 3.4.5. Управление категориями (client/src/pages/admin/Categories.tsx) - Admin и Marketer

**Toolbar:**
- Кнопка "Добавить категорию"

**Таблица:**
- Колонки: Название, Slug, Порядок сортировки, Действия
- Действия: Редактировать, Удалить

**Форма (Modal):**
- Название
- Slug (auto-generate из названия, но можно редактировать)
- Описание
- Порядок сортировки
- Кнопки: "Сохранить", "Отмена"

#### 3.4.6. Управление промокодами (client/src/pages/admin/Promocodes.tsx) - Admin и Marketer

**Toolbar:**
- Кнопка "Создать промокод"

**Таблица:**
- Колонки: Код, Скидка (%), Тип, Использований, Срок действия, Статус, Действия
- Действия: Редактировать, Удалить (только Admin), Деактивировать

**Форма (Modal):**
- Код (input, uppercase)
- Процент скидки (number, 1-100)
- Минимальная сумма заказа (number, 0 = без ограничений)
- Максимальная сумма заказа (number, nullable)
- Тип (radio): Одноразовый, Временный
- Срок действия (date-time picker, только для временных)
- Кнопки: "Создать", "Отмена"

#### 3.4.7. Управление заказами (client/src/pages/admin/Orders.tsx) - Admin

**Toolbar:**
- Фильтр по статусу (dropdown)
- Поиск по номеру заказа

**Таблица:**
- Колонки: Номер, Клиент, Дата, Сумма, Статус, Действия
- Действия: "Детали" → modal с полной информацией о заказе
  - Список товаров
  - Контактная информация клиента
  - Адрес доставки
  - Способ оплаты
  - Статус доставки
  - Трек-номер (если есть)
  - Кнопка "Изменить статус" (dropdown) - вручную

#### 3.4.8. Статистика (client/src/pages/admin/Statistics.tsx) - Admin и Marketer

**Период выбора:**
- Dropdown: День, Неделя, Месяц, Всё время

**Метрики:**
- Общая выручка за период
- Количество заказов
- Средний чек

**Поартикульная выручка:**
- Таблица: Товар, Количество продаж, Выручка
- Сортировка по выручке (default)
- Pagination

**График продаж:**
- Аналогично дашборду

#### 3.4.9. Чат поддержки (консультант/админ) (client/src/pages/admin/SupportChat.tsx)

**Layout:**
- Список диалогов (слева, 1/3 ширины):
  - Для каждого клиента: Имя, последнее сообщение, время
  - Бейдж с количеством непрочитанных сообщений
  - Индикатор "есть непрочитанные" (красная точка)
  - Клик на диалог → открыть в правой части

- Активный диалог (центр, 1/3 ширины):
  - Header: Имя клиента
  - Messages area (аналогично клиентскому чату)
  - Input area для ответа (text + прикрепить файлы)

- Информация о клиенте (справа, 1/3 ширины):
  - Имя
  - Email
  - Телефон
  - История заказов (список с датами и суммами)

**WebSocket:**
- Автоматическое обновление при новых сообщениях
- Обновление списка диалогов при новом сообщении

### 3.5. Аутентификация

#### 3.5.1. Страница регистрации (client/src/pages/Register.tsx)

- Форма:
  - Email (required)
  - Пароль (required, min 8 символов)
  - Подтвердить пароль (required, должен совпадать)
  - Имя (required)
  - Фамилия (optional)
  - Отчество (optional)
  - Телефон (required)
  - Чекбокс "Согласен с условиями" (required)
- Кнопка "Зарегистрироваться"
- После успешной регистрации - сообщение "Проверьте почту для подтверждения"
- Ссылка "Уже есть аккаунт? Войти"

#### 3.5.2. Страница входа (client/src/pages/Login.tsx)

- Форма:
  - Email (required)
  - Пароль (required)
  - Чекбокс "Запомнить меня"
- Кнопка "Войти"
- Ссылка "Забыли пароль?" (опционально)
- Ссылка "Нет аккаунта? Зарегистрироваться"

#### 3.5.3. Страница верификации email (client/src/pages/VerifyEmail.tsx)

- При загрузке страницы отправить GET /api/auth/verify-email?token=xxx
- Показать статус:
  - Loading: Spinner "Проверяем ваш email..."
  - Success: "Email подтверждён! Теперь вы можете войти"
  - Error: "Ссылка недействительна или истекла"

### 3.6. Состояние приложения (Zustand)

Создать store(ы) для управления состоянием:

**client/src/stores/authStore.ts:**
- `user`: User | null
- `token`: string | null
- `isAuthenticated`: boolean
- `login(token, user)`
- `logout()`
- `setUser(user)`

**client/src/stores/cartStore.ts:**
- `items`: CartItem[]
- `addToCart(productId, quantity)`
- `removeFromCart(productId)`
- `updateQuantity(productId, quantity)`
- `clearCart()`
- `getTotal()`

**client/src/stores/chatStore.ts:**
- `isOpen`: boolean
- `unreadCount`: number
- `openChat()`
- `closeChat()`
- `setUnreadCount(count)`

### 3.7. Интеграции и API клиенты

#### 3.7.1. API Client (client/src/lib/api.ts)

Обёртка над `apiRequest` из `@lib/queryClient` для всех API вызовов:

```typescript
// Примеры функций:
- login(email, password): Promise<{ token, user }>
- register(data): Promise<{ success, message }>
- verifyEmail(token): Promise<{ success }>
- getProducts(filters): Promise<{ products, total, page, totalPages }>
- getProductById(id): Promise<Product>
- addToCart(productId, quantity): Promise<void>
- getCart(): Promise<CartItem[]>
- createOrder(data): Promise<{ orderId, paymentUrl? }>
// и т.д. для всех endpoints
```

#### 3.7.2. WebSocket Client (client/src/lib/websocket.ts)

```typescript
class WebSocketClient {
  private socket: WebSocket | null = null;
  
  connect(token: string) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle events (new_message, message_read)
    };
  }
  
  disconnect() {
    this.socket?.close();
  }
  
  send(event: string, data: any) {
    this.socket?.send(JSON.stringify({ event, data }));
  }
}

export const wsClient = new WebSocketClient();
```

#### 3.7.3. React Query hooks (client/src/hooks/)

Использовать TanStack Query для всех запросов:

**useProducts.ts:**
```typescript
export function useProducts(filters) {
  return useQuery({
    queryKey: ['/api/products', filters],
    // queryFn is auto-configured
  });
}
```

**useProduct.ts:**
```typescript
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['/api/products', id],
  });
}
```

**useCart.ts:**
```typescript
export function useCart() {
  return useQuery({
    queryKey: ['/api/cart'],
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }) => 
      apiRequest('POST', '/api/cart', { productId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });
}
```

Аналогично для всех других ресурсов.

### 3.8. Роутинг (client/src/App.tsx)

Настроить маршруты с использованием Wouter:

```typescript
<Switch>
  {/* Public routes */}
  <Route path="/" component={Home} />
  <Route path="/catalog" component={Catalog} />
  <Route path="/products/:id" component={ProductDetail} />
  <Route path="/login" component={Login} />
  <Route path="/register" component={Register} />
  <Route path="/verify-email" component={VerifyEmail} />
  
  {/* Protected routes */}
  <Route path="/cart" component={Cart} />
  <Route path="/checkout" component={Checkout} />
  <Route path="/profile" component={Profile} />
  <Route path="/wishlist" component={Wishlist} />
  <Route path="/comparison" component={Comparison} />
  
  {/* Admin routes */}
  <Route path="/admin" component={AdminLayout}>
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/users" component={Users} />
    <Route path="/products" component={AdminProducts} />
    <Route path="/categories" component={Categories} />
    <Route path="/orders" component={Orders} />
    <Route path="/promocodes" component={Promocodes} />
    <Route path="/statistics" component={Statistics} />
    <Route path="/support" component={AdminSupportChat} />
  </Route>
  
  {/* 404 */}
  <Route component={NotFound} />
</Switch>
```

**Protected Route Wrapper:**
```typescript
function ProtectedRoute({ children, roles? }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  if (roles && !user.roles.some(r => roles.includes(r))) {
    return <div>Access Denied</div>;
  }
  
  return children;
}
```

### 3.9. Тестирование и полировка

1. **Проверить все состояния:**
   - Loading (skeleton)
   - Empty (EmptyState)
   - Error (сообщения об ошибках)

2. **Адаптивный дизайн:**
   - Протестировать на mobile, tablet, desktop
   - Убедиться, что все компоненты адаптивны

3. **Доступность:**
   - Проверить keyboard navigation
   - Проверить screen reader labels
   - Проверить color contrast

4. **Производительность:**
   - Оптимизировать изображения (lazy loading)
   - Code splitting для страниц

---

## ФАЗА 4: ИНТЕГРАЦИИ

### 4.1. ЮKassa (Платежи)

**Установка:**
```bash
npm install @a2seven/yoo-checkout
```

**Backend (server/yukassa.ts):**
```typescript
import { YooCheckout } from '@a2seven/yoo-checkout';

const checkout = new YooCheckout({
  shopId: process.env.YUKASSA_SHOP_ID,
  secretKey: process.env.YUKASSA_SECRET_KEY,
});

export async function createPayment(amount: number, orderId: string, returnUrl: string) {
  const payment = await checkout.createPayment({
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB',
    },
    confirmation: {
      type: 'redirect',
      return_url: returnUrl,
    },
    capture: true,
    metadata: { orderId },
  });
  
  return payment;
}

export async function getPaymentInfo(paymentId: string) {
  return await checkout.getPayment(paymentId);
}

// Для сохранения карт (токенизация)
export async function createPaymentWithSaving(amount: number, orderId: string, returnUrl: string) {
  const payment = await checkout.createPayment({
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB',
    },
    confirmation: {
      type: 'redirect',
      return_url: returnUrl,
    },
    capture: true,
    save_payment_method: true,
    metadata: { orderId },
  });
  
  return payment;
}

export async function createPaymentWithToken(amount: number, orderId: string, paymentToken: string) {
  const payment = await checkout.createPayment({
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB',
    },
    payment_method_id: paymentToken,
    capture: true,
    metadata: { orderId },
  });
  
  return payment;
}
```

**Webhook для обработки платежей (в server/routes.ts):**
```typescript
app.post('/api/yukassa/webhook', async (req, res) => {
  // Проверить подпись (security)
  const event = req.body;
  
  if (event.event === 'payment.succeeded') {
    const paymentId = event.object.id;
    const orderId = event.object.metadata.orderId;
    
    // Найти заказ
    const order = await storage.getOrder(orderId);
    
    if (order && order.status === 'pending') {
      // Обновить статус на 'paid'
      await storage.updateOrderStatus(orderId, 'paid', { paidAt: new Date() });
      
      // Очистить корзину
      await storage.clearCart(order.userId);
      
      // Уменьшить остатки товаров
      for (const item of order.items) {
        await storage.decreaseProductStock(item.productId, item.quantity);
      }
      
      // Применить промокод
      if (order.promocodeId) {
        await applyPromocode(order.promocodeId, order.userId, orderId);
      }
      
      // Начислить бонусы
      if (order.bonusesEarned > 0) {
        await storage.addBonuses(order.userId, order.bonusesEarned);
      }
      
      // Сохранить payment_method_id если пользователь выбрал сохранение
      if (event.object.payment_method && event.object.save_payment_method) {
        const pm = event.object.payment_method;
        await storage.savePaymentCard({
          userId: order.userId,
          yukassaPaymentToken: pm.id,
          cardLastFour: pm.card.last4,
          cardType: pm.card.card_type,
        });
      }
    }
  }
  
  res.status(200).send('OK');
});
```

### 4.2. СДЭК API (Доставка)

**Документация:** https://api-docs.cdek.ru/

**Backend (server/cdek.ts):**
```typescript
import axios from 'axios';

const CDEK_API_URL = 'https://api.cdek.ru/v2';
const CDEK_CLIENT_ID = process.env.CDEK_CLIENT_ID;
const CDEK_CLIENT_SECRET = process.env.CDEK_CLIENT_SECRET;

let accessToken: string | null = null;
let tokenExpires: number = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpires) {
    return accessToken;
  }
  
  const response = await axios.post(`${CDEK_API_URL}/oauth/token`, {
    grant_type: 'client_credentials',
    client_id: CDEK_CLIENT_ID,
    client_secret: CDEK_CLIENT_SECRET,
  });
  
  accessToken = response.data.access_token;
  tokenExpires = Date.now() + response.data.expires_in * 1000;
  
  return accessToken;
}

export async function calculateDelivery(params: {
  fromLocation: { code: string }, // код города отправления
  toLocation: { code: string }, // код города получения
  packages: [{ weight: number, length: number, width: number, height: number }],
  tariffCode: number, // 136 = ПВЗ, 138 = постамат, 234 = курьер
}) {
  const token = await getAccessToken();
  
  const response = await axios.post(`${CDEK_API_URL}/calculator/tariff`, params, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  return {
    cost: response.data.delivery_sum,
    estimatedDays: response.data.period_max,
  };
}

export async function getDeliveryPoints(cityCode: string, type?: 'PVZ' | 'POSTAMAT') {
  const token = await getAccessToken();
  
  const params: any = { city_code: cityCode };
  if (type) params.type = type;
  
  const response = await axios.get(`${CDEK_API_URL}/deliverypoints`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  
  return response.data.map((point: any) => ({
    code: point.code,
    name: point.name,
    address: point.location.address_full,
    workTime: point.work_time,
  }));
}

export async function createOrder(orderData: any) {
  const token = await getAccessToken();
  
  const response = await axios.post(`${CDEK_API_URL}/orders`, orderData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  return response.data;
}

export async function getOrderStatus(cdekOrderUuid: string) {
  const token = await getAccessToken();
  
  const response = await axios.get(`${CDEK_API_URL}/orders/${cdekOrderUuid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  return response.data;
}
```

### 4.3. Boxberry API (Доставка)

**Документация:** https://api.boxberry.ru/

**Backend (server/boxberry.ts):**
```typescript
import axios from 'axios';

const BOXBERRY_API_URL = 'https://api.boxberry.ru/json.php';
const BOXBERRY_API_TOKEN = process.env.BOXBERRY_API_TOKEN;

export async function calculateDelivery(params: {
  targetStart: string, // город отправления
  target: string, // город получения
  weight: number, // вес в граммах
  deliveryType: 'ПВЗ' | 'Курьер',
}) {
  const response = await axios.get(BOXBERRY_API_URL, {
    params: {
      token: BOXBERRY_API_TOKEN,
      method: 'DeliveryCosts',
      ...params,
    },
  });
  
  return {
    cost: response.data.price,
    estimatedDays: response.data.delivery_period,
  };
}

export async function getDeliveryPoints(city: string, type?: 'ПВЗ' | 'Постамат') {
  const response = await axios.get(BOXBERRY_API_URL, {
    params: {
      token: BOXBERRY_API_TOKEN,
      method: 'ListPoints',
      CityCode: city,
    },
  });
  
  let points = response.data;
  
  if (type === 'ПВЗ') {
    points = points.filter((p: any) => p.IssuanceBoxberry);
  } else if (type === 'Постамат') {
    points = points.filter((p: any) => !p.IssuanceBoxberry);
  }
  
  return points.map((point: any) => ({
    code: point.Code,
    name: point.Name,
    address: point.Address,
    workTime: point.WorkSchedule,
  }));
}

export async function createParcel(parcelData: any) {
  const response = await axios.post(BOXBERRY_API_URL, {
    token: BOXBERRY_API_TOKEN,
    method: 'ParcelCreate',
    ...parcelData,
  });
  
  return response.data;
}

export async function getParcelStatus(trackNumber: string) {
  const response = await axios.get(BOXBERRY_API_URL, {
    params: {
      token: BOXBERRY_API_TOKEN,
      method: 'ListStatuses',
      ImId: trackNumber,
    },
  });
  
  return response.data;
}
```

### 4.4. Cron job для обновления статусов заказов

**Установка:**
```bash
npm install node-cron
```

**Backend (server/cron.ts):**
```typescript
import cron from 'node-cron';
import { storage } from './storage';
import { getOrderStatus as getCdekStatus } from './cdek';
import { getParcelStatus as getBoxberryStatus } from './boxberry';

export function startCronJobs() {
  // Каждые 15 минут
  cron.schedule('*/15 * * * *', async () => {
    console.log('Checking order statuses...');
    
    // Получить все заказы со статусом 'shipped'
    const orders = await storage.getOrdersByStatus('shipped');
    
    for (const order of orders) {
      try {
        let status: any;
        
        if (order.deliveryService === 'cdek') {
          status = await getCdekStatus(order.deliveryTrackingNumber);
        } else if (order.deliveryService === 'boxberry') {
          status = await getBoxberryStatus(order.deliveryTrackingNumber);
        }
        
        // Проверить статус
        if (isDelivered(status)) {
          await storage.updateOrderStatus(order.id, 'delivered', {
            deliveredAt: new Date(),
          });
        }
        
        if (isCompleted(status)) {
          await storage.updateOrderStatus(order.id, 'completed', {
            completedAt: new Date(),
          });
        }
      } catch (error) {
        console.error(`Error checking order ${order.id}:`, error);
      }
    }
  });
}

function isDelivered(status: any): boolean {
  // Логика определения статуса "Доставлен" для каждой службы
  // СДЭК: status.status === 'Arrived at the pick-up point'
  // Boxberry: status последний элемент содержит 'Доставлено'
  return false; // placeholder
}

function isCompleted(status: any): boolean {
  // Логика определения статуса "Получено клиентом"
  return false; // placeholder
}
```

**В server/index.ts:**
```typescript
import { startCronJobs } from './cron';

// После запуска сервера
startCronJobs();
```

---

## ФАЗА 5: ТЕСТИРОВАНИЕ И ДЕПЛОЙ

### 5.1. Тестирование

1. **Функциональное тестирование:**
   - Регистрация и вход
   - Добавление товаров в корзину
   - Оформление заказа (все способы доставки и оплаты)
   - Применение промокода
   - Использование бонусов
   - Работа чата поддержки
   - Админ-панель (все CRUD операции)

2. **Тестирование интеграций:**
   - ЮKassa (тестовые платежи)
   - СДЭК API (расчёт доставки, получение ПВЗ)
   - Boxberry API (аналогично)
   - Email-верификация

3. **Кроссбраузерное тестирование:**
   - Chrome, Firefox, Safari, Edge

4. **Адаптивность:**
   - Mobile (iPhone, Android)
   - Tablet (iPad)
   - Desktop (различные разрешения)

### 5.2. Оптимизация

1. **Производительность:**
   - Оптимизация изображений (WebP, lazy loading)
   - Code splitting
   - Minification и gzip

2. **SEO:**
   - Meta tags для всех страниц
   - Open Graph tags
   - Sitemap

3. **Безопасность:**
   - HTTPS
   - Защита от SQL Injection (Drizzle ORM)
   - Защита от XSS
   - CSRF tokens
   - Rate limiting

### 5.3. Документация

Создать файлы:
- `README.md` - описание проекта, установка, запуск
- `API.md` - документация API endpoints
- `.env.example` - пример файла с переменными окружения

**Переменные окружения (.env):**
```
DATABASE_URL=postgresql://...
SESSION_SECRET=random_secret_here
YUKASSA_SHOP_ID=your_shop_id
YUKASSA_SECRET_KEY=your_secret_key
CDEK_CLIENT_ID=your_client_id
CDEK_CLIENT_SECRET=your_client_secret
BOXBERRY_API_TOKEN=your_token
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
SITE_URL=https://yoursite.com
```

### 5.4. Деплой

1. **Подготовка:**
   - Запустить `npm run build`
   - Проверить production build локально

2. **База данных:**
   - Создать production БД PostgreSQL
   - Запустить `npm run db:push` на production

3. **Загрузка файлов:**
   - Настроить папку `uploads/` для хранения изображений
   - Или использовать CDN (Cloudflare, AWS S3)

4. **Настройка сервера:**
   - Node.js + PM2 для управления процессом
   - Nginx для reverse proxy и статических файлов
   - SSL сертификат (Let's Encrypt)

5. **Мониторинг:**
   - Логирование (Winston, Bunyan)
   - Мониторинг ошибок (Sentry)
   - Мониторинг производительности (New Relic, Datadog)

---

## ФАЗА 6: БУДУЩИЕ УЛУЧШЕНИЯ (next_phase)

1. **Мультиязычность:**
   - Интеграция i18next
   - Перевод интерфейса на английский и китайский
   - Админ-панель для управления переводами товаров

2. **Email-уведомления:**
   - Подтверждение заказа
   - Изменение статуса заказа
   - Уведомления консультантам о новых сообщениях

3. **Система отзывов:**
   - Модель reviews в БД
   - Форма добавления отзыва (после получения заказа)
   - Модерация отзывов в админ-панели
   - Отображение отзывов на странице товара

4. **Расширенная аналитика:**
   - Воронка продаж
   - LTV клиентов
   - ABC-анализ товаров
   - Когортный анализ

5. **Экспорт отчётов:**
   - Excel/PDF отчёты для администратора
   - Выгрузка заказов, товаров, клиентов

6. **Интеграция с 1C:**
   - Синхронизация товаров, остатков и цен через CommerceML
   - Настройка автоматической синхронизации по расписанию

7. **Push-уведомления:**
   - Web Push для новых акций, статусов заказов

8. **Программа лояльности:**
   - Уровни (Bronze, Silver, Gold) в зависимости от суммы покупок
   - Дополнительные бонусы для VIP-клиентов

---

## ИТОГОВЫЙ ЧЕКЛИСТ

### Backend
- [ ] Схемы БД созданы и развёрнуты (npm run db:push)
- [ ] Все API endpoints реализованы и протестированы
- [ ] Аутентификация и авторизация работают
- [ ] Email-верификация работает
- [ ] Интеграция ЮKassa настроена и протестирована
- [ ] Интеграция СДЭК работает (расчёт доставки, ПВЗ)
- [ ] Интеграция Boxberry работает
- [ ] WebSocket для чата настроен
- [ ] Cron job для обновления статусов запущен
- [ ] Бонусная система работает корректно
- [ ] Промокоды применяются правильно

### Frontend
- [ ] Дизайн-система настроена (цвета, шрифты)
- [ ] Все страницы созданы и адаптивны
- [ ] Компоненты переиспользуемые и модульные
- [ ] Состояния (loading, empty, error) реализованы везде
- [ ] Роутинг настроен (public, protected, admin routes)
- [ ] Формы валидированы (React Hook Form + Zod)
- [ ] React Query hooks для всех запросов
- [ ] Zustand stores настроены
- [ ] WebSocket клиент работает для чата
- [ ] Корзина работает (добавление, удаление, обновление)
- [ ] Оформление заказа проходит все шаги
- [ ] Личный кабинет полностью функционален
- [ ] Админ-панель работает для всех ролей
- [ ] Чат поддержки работает в реальном времени

### Интеграции
- [ ] ЮKassa: создание платежей, webhook, сохранение карт
- [ ] СДЭК: расчёт доставки, получение ПВЗ, создание заказов, отслеживание
- [ ] Boxberry: аналогично СДЭК
- [ ] Nodemailer: отправка email-верификации

### Тестирование
- [ ] Все функции протестированы вручную
- [ ] Crossбrowser тестирование
- [ ] Адаптивность на всех устройствах
- [ ] Нагрузочное тестирование (опционально)

### Деплой
- [ ] Production база данных настроена
- [ ] Переменные окружения настроены
- [ ] Сервер настроен (Nginx, SSL)
- [ ] Мониторинг настроен

---

## ПРИМЕЧАНИЯ

1. **Точность выполнения:** Следуйте этому TODO.md строго. Два разработчика, следующие этому документу, должны создать практически идентичные приложения (~99% совпадение).

2. **Приоритеты:**
   - Фаза 1-2 (Backend): Критически важно для функционирования
   - Фаза 3 (Frontend): Критически важно для UX
   - Фаза 4 (Интеграции): Необходимо для полноценной работы магазина
   - Фаза 5-6: Улучшения и оптимизация

3. **Порядок разработки:**
   - Начать с Фазы 1 (схемы БД)
   - Затем Фаза 2 (Backend API)
   - Параллельно можно начинать Фазу 3 (Frontend), используя моковые данные
   - После завершения Backend и Frontend - Фаза 4 (Интеграции)
   - Фаза 5 (Тестирование) - непрерывно на протяжении разработки

4. **Код-стиль:**
   - TypeScript строгий режим
   - ESLint + Prettier
   - Именование: camelCase для переменных/функций, PascalCase для компонентов/типов
   - Комментарии на русском языке

5. **Git:**
   - Коммиты на каждый завершённый модуль
   - Осмысленные сообщения коммитов
   - Feature branches для крупных изменений

6. **Безопасность:**
   - Никогда не коммитить .env файл
   - Использовать .env.example
   - Валидация всех входных данных
   - Хеширование паролей (bcrypt)
   - JWT токены с коротким сроком действия

Удачи в разработке! 🚀
