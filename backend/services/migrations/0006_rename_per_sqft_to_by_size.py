from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0005_add_icon_to_service_price'),
    ]

    operations = [
        migrations.RunSQL(
            sql="UPDATE services_service SET unit = 'by_size' WHERE unit = 'per_sqft';",
            reverse_sql="UPDATE services_service SET unit = 'per_sqft' WHERE unit = 'by_size';",
        ),
        migrations.AlterField(
            model_name='service',
            name='unit',
            field=models.CharField(
                choices=[('per_job', 'Per Job'), ('per_item', 'Per Item'), ('by_size', 'By Size')],
                default='per_job',
                max_length=20,
            ),
        ),
    ]
