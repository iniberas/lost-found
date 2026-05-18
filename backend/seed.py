"""
Database Seeder - REALISTIC VERSION
- Relevant images
- Minimal duplicates
- Massive title variation
- Better descriptions
"""

import argparse
import asyncio
import uuid
import os
import random
from datetime import datetime, timezone, timedelta

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from app.infrastructure.database.models import (
    UserModel,
    AdminModel,
    SuperAdminModel,
    CategoryModel,
    LostReportModel,
    FoundReportModel,
    ProofModel,
    StorageLocationModel,
    AuditLogModel,
    ContactRequestModel,
)

from app.infrastructure.database.models.audit_log import EntityType, ActionType
from app.infrastructure.database.models.contact_request import (
    RequestStatus,
    ReportType as ContactReportType,
)
from app.infrastructure.database.models.report import (
    ReportStatus,
    FoundStatus,
    ReportType,
)
from app.infrastructure.database.models.user import UserRole

from geoalchemy2.shape import from_shape
from shapely.geometry import Point

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres",
)

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEFAULT_CENTER_LAT = -6.5607
DEFAULT_CENTER_LNG = 106.7265

USED_IMAGES = set()

# ============================================================================
# IMAGES
# ============================================================================

CATEGORY_IMAGES = {

    "Dompet": [
        "https://images.unsplash.com/photo-1627123424574-724758594e93",
        "https://images.unsplash.com/photo-1606503825008-909a67e63c3d",
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa",
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d",
        "https://images.unsplash.com/photo-1626379953822-baec19c3accd",
        "https://images.unsplash.com/photo-1611078489935-0cb964de46d6",
    ],

    "Tas": [
        "https://images.unsplash.com/photo-1581605405669-fcdf81165afa",
        "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7",
        "https://images.unsplash.com/photo-1523398002811-999ca8dec234",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    ],

    "Kunci": [
        "https://images.unsplash.com/photo-1582139329536-e7284fece509",
        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a",
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3",
        "https://images.unsplash.com/photo-1556740749-887f6717d7e4",
        "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7",
    ],

    "Dokumen": [
        "https://images.unsplash.com/photo-1455390582262-044cdead277a",
        "https://images.unsplash.com/photo-1517842645767-c639042777db",
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173",
        "https://images.unsplash.com/photo-1513258496099-48168024aec0",
    ],

    "Elektronik": [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
        "https://images.unsplash.com/photo-1517336714739-489689fd1ca8",
        "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",
        "https://images.unsplash.com/photo-1545239351-1141bd82e8a6",
        "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944",
    ],

    "Perhiasan": [
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338",
        "https://images.unsplash.com/photo-1602173574767-37ac01994b2a",
        "https://images.unsplash.com/photo-1523170335258-f5ed11844a49",
        "https://images.unsplash.com/photo-1617038220319-276d3cfab638",
    ],

    "Pakaian": [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
        "https://images.unsplash.com/photo-1483985988355-763728e1935b",
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b",
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
        "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb",
    ],

    "Kacamata": [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083",
        "https://images.unsplash.com/photo-1577803645773-f96470509666",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9",
        "https://images.unsplash.com/photo-1511920170033-f8396924c348",
    ],

    "Kartu Identitas": [
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f",
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        "https://images.unsplash.com/photo-1556740749-887f6717d7e4",
    ],

    "Lainnya": [
        "https://images.unsplash.com/photo-1523362628745-0c100150b504",
        "https://images.unsplash.com/photo-1491553895911-0055eca6402d",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    ],
}


def get_random_photo(category_name: str) -> str:

    images = CATEGORY_IMAGES.get(
        category_name,
        CATEGORY_IMAGES["Lainnya"]
    )

    available = [
        img for img in images
        if img not in USED_IMAGES
    ]

    if not available:
        USED_IMAGES.clear()
        available = images.copy()

    selected = random.choice(available)

    USED_IMAGES.add(selected)

    return (
        f"{selected}"
        "?w=900"
        "&h=700"
        "&fit=crop"
        "&auto=format"
        "&q=85"
    )


# ============================================================================
# TITLE VARIATION
# ============================================================================

LOST_TITLE_PATTERNS = [
    "{item} hilang di {place}",
    "Kehilangan {item} sekitar {place}",
    "Ada yang lihat {item} saya?",
    "Mencari {item} yang tertinggal di {place}",
    "{item} kemungkinan jatuh di {place}",
    "Lost {item} near {place}",
    "{item} belum ketemu sejak di {place}",
    "Need help menemukan {item}",
    "{item} hilang habis dari {place}",
    "Barangkali ada yang menemukan {item}",
]

FOUND_TITLE_PATTERNS = [
    "Menemukan {item} di {place}",
    "Found {item} near {place}",
    "Ada yang kehilangan {item}?",
    "{item} ditemukan sekitar {place}",
    "Barang temuan: {item}",
    "Nemuin {item} tadi di {place}",
    "{item} diamankan dekat {place}",
    "Barang tertinggal di {place}",
    "{item} ditemukan pagi ini",
    "Siapa pemilik {item} ini?",
]

LOST_DESCRIPTIONS = [
    "{detail}. Terakhir sadar masih ada waktu di {place}.",
    "{detail}. Kemungkinan jatuh saat lewat area {place}.",
    "{detail}. Kalau ada yang nemu boleh kabarin ya.",
    "{detail}. Hilang sejak aktivitas di {place}.",
    "{detail}. Sudah dicari sekitar lokasi tapi belum ketemu.",
]

FOUND_DESCRIPTIONS = [
    "{detail}. Sekarang barang diamankan sementara.",
    "{detail}. Yang merasa memiliki bisa hubungi.",
    "{detail}. Ditemukan tidak jauh dari {place}.",
    "{detail}. Akan disimpan dulu sampai pemilik ditemukan.",
    "{detail}. Silakan claim kalau merasa itu milik anda.",
]


def now() -> datetime:
    return datetime.now(timezone.utc)


def generate_random_timestamp(start_days_ago: int, end_days_ago: int):
    return now() - timedelta(
        days=random.randint(start_days_ago, end_days_ago),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59),
    )


def point(lat: float, lng: float):
    return from_shape(Point(lng, lat), srid=4326)


# ============================================================================
# USERS
# ============================================================================

async def seed_users(session: AsyncSession):

    hashed = pwd_ctx.hash("Password123!")

    superadmin = SuperAdminModel(
        id=uuid.uuid4(),
        created_at=now(),
        updated_at=now(),
        name="Super Admin",
        email="superadmin@example.com",
        phone_number="+621200000001",
        password_hash=hashed,
        role=UserRole.SUPERADMIN,
    )

    admin = AdminModel(
        id=uuid.uuid4(),
        created_at=now(),
        updated_at=now(),
        name="Admin Kampus",
        email="admin@example.com",
        phone_number="+621200000002",
        password_hash=hashed,
        role=UserRole.ADMIN,
    )

    users_data = [
        ("Andi Wijaya", "andi@example.com"),
        ("Siti Rahayu", "siti@example.com"),
        ("Riko Pratama", "riko@example.com"),
        ("Dewi Lestari", "dewi@example.com"),
        ("Hendra Gunawan", "hendra@example.com"),
    ]

    regular_users = []

    for i, (name, email) in enumerate(users_data):

        regular_users.append(
            UserModel(
                id=uuid.uuid4(),
                created_at=now(),
                updated_at=now(),
                name=name,
                email=email,
                phone_number=f"+62811111111{i}",
                password_hash=hashed,
                role=UserRole.USER,
            )
        )

    session.add_all([superadmin, admin, *regular_users])

    await session.flush()

    return {
        "superadmin": superadmin,
        "admin": admin,
        **{
            u.email.split("@")[0]: u
            for u in regular_users
        },
    }


# ============================================================================
# CATEGORIES
# ============================================================================

async def seed_categories(session: AsyncSession):

    names = [
        "Dompet",
        "Tas",
        "Kunci",
        "Dokumen",
        "Elektronik",
        "Perhiasan",
        "Pakaian",
        "Kacamata",
        "Kartu Identitas",
        "Lainnya",
    ]

    categories = []

    for name in names:
        categories.append(
            CategoryModel(
                id=uuid.uuid4(),
                name=name,
                is_active=True,
            )
        )

    session.add_all(categories)

    await session.flush()

    return categories


# ============================================================================
# STORAGE LOCATIONS
# ============================================================================

async def seed_storage_locations(session: AsyncSession):

    data = [
        (
            "Pos Satpam Gerbang Utama",
            "Pusat keamanan utama kampus",
            -6.5545,
            106.7150,
        ),
        (
            "Lobby Rektorat",
            "Area penitipan barang kampus",
            -6.5602,
            106.7255,
        ),
        (
            "Lost & Found Center",
            "Pusat barang hilang",
            -6.5615,
            106.7260,
        ),
    ]

    locations = []

    for name, desc, lat, lng in data:

        locations.append(
            StorageLocationModel(
                id=uuid.uuid4(),
                created_at=now(),
                updated_at=now(),
                name=name,
                description=desc,
                location_point=point(lat, lng),
                is_active=True,
            )
        )

    session.add_all(locations)

    await session.flush()

    return locations


# ============================================================================
# REPORTS
# ============================================================================

async def seed_reports(
    session,
    users,
    categories,
    storage_locations,
):

    cat = {c.name: c for c in categories}

    user_list = [
        users["andi"],
        users["siti"],
        users["riko"],
        users["dewi"],
        users["hendra"],
    ]

    ipb_places = [
        "Perpustakaan Pusat IPB",
        "Masjid Al-Hurriyyah",
        "Gymnasium IPB",
        "CCR",
        "Kantin Stevia",
        "Danau LSI",
        "Koridor Pinus",
        "GWW",
        "FMIPA",
        "FATETA",
        "FEMA",
        "Asrama PKU",
        "Taman Koleksi",
        "Green Canyon",
    ]

    item_templates = [

        (
            "Dompet",
            [
                "Dompet kulit cokelat",
                "Dompet hitam kecil",
                "Card holder",
                "Dompet Eiger",
                "Wallet lipat",
            ],
            [
                "Ada beberapa kartu penting",
                "Bagian pinggir agak rusak",
                "Isi KTM dan uang",
                "Dompet warna gelap",
            ]
        ),

        (
            "Tas",
            [
                "Tas ransel",
                "Tas laptop",
                "Backpack hitam",
                "Tas kuliah",
                "Totebag",
            ],
            [
                "Ada stiker di depan",
                "Tas agak berat",
                "Isi laptop dan charger",
                "Warna hitam polos",
            ]
        ),

        (
            "Elektronik",
            [
                "iPhone",
                "Samsung Galaxy",
                "Laptop ASUS",
                "Headset",
                "Powerbank",
            ],
            [
                "Casing hitam",
                "Ada retak sedikit",
                "Masih menyala",
                "Kondisi bagus",
            ]
        ),

        (
            "Kunci",
            [
                "Kunci motor",
                "Kunci rumah",
                "Keychain",
                "Kunci Honda",
            ],
            [
                "Ada gantungan kecil",
                "Warna silver",
                "Ada remote",
            ]
        ),

        (
            "Pakaian",
            [
                "Jaket",
                "Hoodie",
                "Sweater",
                "Jaket almamater",
            ],
            [
                "Ukuran L",
                "Warna hitam",
                "Masih bersih",
            ]
        ),
    ]

    lost_reports = []
    found_reports = []

    # LOST
    for _ in range(50):

        reporter = random.choice(user_list)

        cat_name, item_names, details = random.choice(item_templates)

        item = random.choice(item_names)

        detail = random.choice(details)

        place = random.choice(ipb_places)

        title = random.choice(
            LOST_TITLE_PATTERNS
        ).format(
            item=item,
            place=place,
        )

        description = random.choice(
            LOST_DESCRIPTIONS
        ).format(
            detail=detail,
            place=place,
        )

        inc_date = generate_random_timestamp(2, 45)

        report = LostReportModel(
            id=uuid.uuid4(),
            created_at=inc_date,
            updated_at=now(),
            reporter_id=reporter.id,
            title=title,
            description=description,
            location_name=place,
            incident_date=inc_date,
            photos=[
                get_random_photo(cat_name),
                get_random_photo(cat_name),
            ],
            report_status=random.choice([
                ReportStatus.OPEN,
                ReportStatus.RESOLVED,
            ]),
            report_type=ReportType.LOST,
            location_point=point(
                DEFAULT_CENTER_LAT + random.uniform(-0.003, 0.003),
                DEFAULT_CENTER_LNG + random.uniform(-0.003, 0.003),
            ),
        )

        report.categories = [cat[cat_name]]

        session.add(report)

        lost_reports.append(report)

    await session.flush()

    # FOUND
    for _ in range(50):

        reporter = random.choice(user_list)

        cat_name, item_names, details = random.choice(item_templates)

        item = random.choice(item_names)

        detail = random.choice(details)

        place = random.choice(ipb_places)

        title = random.choice(
            FOUND_TITLE_PATTERNS
        ).format(
            item=item,
            place=place,
        )

        description = random.choice(
            FOUND_DESCRIPTIONS
        ).format(
            detail=detail,
            place=place,
        )

        inc_date = generate_random_timestamp(1, 40)

        found_status = random.choice([
            FoundStatus.HELD_BY_FINDER,
            FoundStatus.HELD_BY_ADMIN,
            FoundStatus.RETURNED_TO_OWNER,
        ])

        storage_loc = None
        holder = reporter
        proof_id = None

        if found_status == FoundStatus.HELD_BY_ADMIN:

            storage_loc = random.choice(
                storage_locations
            )

            holder = users["admin"]

            proof = ProofModel(
                id=uuid.uuid4(),
                created_at=now(),
                notes="Barang diamankan admin.",
                photos=[
                    get_random_photo(cat_name)
                ],
            )

            session.add(proof)

            await session.flush()

            proof_id = proof.id

        report = FoundReportModel(
            id=uuid.uuid4(),
            created_at=inc_date,
            updated_at=now(),
            reporter_id=reporter.id,
            title=title,
            description=description,
            location_name=place,
            incident_date=inc_date,
            photos=[
                get_random_photo(cat_name)
            ],
            report_status=(
                ReportStatus.RESOLVED
                if found_status == FoundStatus.RETURNED_TO_OWNER
                else ReportStatus.OPEN
            ),
            location_point=point(
                DEFAULT_CENTER_LAT + random.uniform(-0.003, 0.003),
                DEFAULT_CENTER_LNG + random.uniform(-0.003, 0.003),
            ),
            found_status=found_status,
            report_type=ReportType.FOUND,
            storage_location_id=(
                storage_loc.id
                if storage_loc
                else None
            ),
            holder_id=holder.id,
            proof_id=proof_id,
        )

        report.categories = [cat[cat_name]]

        session.add(report)

        found_reports.append(report)

    await session.flush()

    return lost_reports, found_reports


REQUEST_MESSAGES = [

    "Halo kak, kayaknya barang itu punya saya deh.",
    "Permisi kak, saya merasa itu barang saya yang hilang.",
    "Boleh minta detail tambahan barangnya?",
    "Kayaknya itu barang saya, bisa cek ciri-cirinya?",
    "Halo, saya kehilangan barang mirip seperti di laporan ini.",
    "Kak saya mau claim barang ini.",
    "Apakah barangnya masih ada?",
    "Boleh minta foto tambahan?",
    "Saya rasa saya pemilik barang tersebut.",
    "Kak, saya tertarik untuk konfirmasi barang ini.",
    "Saya kehilangan barang serupa minggu lalu.",
    "Halo kak, boleh lanjut komunikasi via WA?",
    "Saya menemukan barang yang mungkin cocok dengan laporan ini.",
    "Mau memastikan dulu sebelum claim.",
    "Bisa dibantu pengecekan detailnya kak?",
]

REQUEST_RESPONSES = [

    "Boleh kak, nanti saya kirim detailnya.",
    "Masih ada kak.",
    "Silakan kirim bukti kepemilikan ya.",
    "Boleh, coba sebutkan ciri detailnya.",
    "Sudah saya chat via WhatsApp.",
    "Barang masih diamankan.",
    "Kayaknya cocok, lanjut aja.",
    "Boleh kak, nanti ketemu langsung aja.",
    "Maaf ternyata kurang cocok.",
    "Sip, nanti saya kabari lagi.",
]


async def seed_contact_requests(
    session: AsyncSession,
    users: dict[str, UserModel],
    lost_reports: list[LostReportModel],
    found_reports: list[FoundReportModel],
):

    print("📨 Seeding contact requests...")

    user_list = [
        users["andi"],
        users["siti"],
        users["riko"],
        users["dewi"],
        users["hendra"],
    ]

    contact_requests = []

    # MIX LOST + FOUND
    all_reports = (
        [(r, ContactReportType.LOST) for r in lost_reports[:30]]
        + [(r, ContactReportType.FOUND) for r in found_reports[:30]]
    )

    random.shuffle(all_reports)

    for report, report_type in all_reports:

        possible_requesters = [
            u for u in user_list
            if u.id != report.reporter_id
        ]

        if not possible_requesters:
            continue

        requester = random.choice(
            possible_requesters
        )

        status = random.choice([
            RequestStatus.PENDING,
            RequestStatus.APPROVED,
            RequestStatus.REJECTED,
            RequestStatus.APPROVED,
        ])

        created_at = generate_random_timestamp(1, 20)

        response_message = None
        responded_at = None

        if status != RequestStatus.PENDING:

            response_message = random.choice(
                REQUEST_RESPONSES
            )

            responded_at = (
                created_at
                + timedelta(
                    hours=random.randint(1, 48)
                )
            )

        request = ContactRequestModel(

            id=uuid.uuid4(),

            created_at=created_at,
            updated_at=now(),

            requester_id=requester.id,

            target_user_id=report.reporter_id,

            report_id=report.id,

            report_type=report_type,

            status=status,

            is_response_seen=(
                status != RequestStatus.PENDING
            ),

            message=random.choice(
                REQUEST_MESSAGES
            ),

            response_message=response_message,

            responded_at=responded_at,
        )

        contact_requests.append(request)

    session.add_all(contact_requests)

    await session.flush()

    print(
        f"   ✓ {len(contact_requests)} contact requests created."
    )

# ============================================================================
# MAIN
# ============================================================================

async def run(clear=False):

    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
    )

    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:

        async with session.begin():

            if clear:

                tables = [
                    "audit_logs",
                    "contact_requests",
                    "report_categories",
                    "lost_reports",
                    "found_reports",
                    "reports",
                    "proofs",
                    "storage_locations",
                    "categories",
                    "users",
                ]

                for table in tables:
                    await session.execute(
                        text(f'TRUNCATE TABLE "{table}" CASCADE')
                    )

            users = await seed_users(session)

            categories = await seed_categories(session)

            storage_locations = await seed_storage_locations(session)

            await seed_reports(
                session,
                users,
                categories,
                storage_locations,
            )

            lost_reports, found_reports = await seed_reports(
              session,
              users,
              categories,
              storage_locations,
            )

            await seed_contact_requests(
                session,
                users,
                lost_reports,
                found_reports,
            )

    await engine.dispose()

    print("DONE")


if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--clear",
        action="store_true",
    )

    args = parser.parse_args()

    asyncio.run(run(clear=args.clear))