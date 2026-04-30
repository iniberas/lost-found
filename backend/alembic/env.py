import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))
from app.infrastructure.database.models.base import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection, **kwargs) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, **kwargs)

    with context.begin_transaction():
        context.run_migrations()


# async def run_async_migrations() -> None:
#     """In this scenario we need to create an Engine
#     and associate a connection with the context.

#     """

#     connectable = async_engine_from_config(
#         config.get_section(config.config_ini_section, {}),
#         prefix="sqlalchemy.",
#         poolclass=pool.NullPool,
#     )

#     async with connectable.connect() as connection:
#         await connection.run_sync(do_run_migrations)

#     await connectable.dispose()


def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table":
        # List of specific PostGIS/Tiger tables to ignore
        ignored_tables = {
            "spatial_ref_sys",
            "geometry_columns",
            "geography_columns",
            "raster_columns",
            "raster_overviews",
            "topology",
            "layer",
            # Tiger geocoding tables
            "place",
            "tabblock",
            "tabblock20",
            "featnames",
            "zcta5",
            "edges",
            "faces",
            "county",
            "state",
            "tract",
            "bg",
            "cousub",
            "addrfeat",
        }
        # Check if table should be ignored
        if (
            name in ignored_tables
            or name.startswith("tiger")
            or name.startswith("topology")
            or name.startswith("addr")
            or name.startswith("zip_")
            or name.startswith("pagc_")
            or name.endswith("_lookup")
            or name.startswith("loader_")
            or name.startswith("geocode_")
        ):
            return False
    return True


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    configuration = config.get_section(config.config_ini_section, {})
    # This grabs DATABASE_URL from your .env / docker-compose environment
    url = os.getenv("DATABASE_URL")
    if url:
        configuration["sqlalchemy.url"] = url

    # ----------------------
    async def run_async_migrations():
        connectable = async_engine_from_config(
            configuration,
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

        async with connectable.connect() as connection:
            await connection.run_sync(
                do_run_migrations,
                include_object=include_object,
            )

        await connectable.dispose()

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
