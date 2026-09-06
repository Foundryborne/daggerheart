export default function rangeDependenceMigration(source) {
    if (source.rangeDependence?.enabled === false) {
        source.rangeDependence = null;
    }
}