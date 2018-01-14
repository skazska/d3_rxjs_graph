export function handle (join, enter, update, exit) {
    if (typeof exit === 'function') exit(join.exit());
    return update(join.merge(enter(join.enter())));
}